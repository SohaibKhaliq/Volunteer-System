import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ComplianceDocument from 'App/Models/ComplianceDocument'
import { DateTime } from 'luxon'
import Drive from '@ioc:Adonis/Core/Drive'
import Logger from '@ioc:Adonis/Core/Logger'
import ComplianceService from 'App/Services/ComplianceService'

export default class ComplianceController {
  public async index({ auth, response }: HttpContextContract) {
    const user = auth.user!
    const docs = await ComplianceDocument.query().where('user_id', user.id).preload('user')
    return response.ok(docs)
  }

  /**
   * Validate WWCC number
   */
  public async validateWWCC({ request, response }: HttpContextContract) {
    const { wwccNumber, state } = request.only(['wwccNumber', 'state'])

    if (!wwccNumber || !state) {
      return response.badRequest({
        error: 'WWCC number and state are required'
      })
    }

    const validation = ComplianceService.validateWWCC(wwccNumber, state)

    if (!validation.valid) {
      return response.status(422).send({
        error: validation.message
      })
    }

    return response.ok({
      valid: true,
      formatted: ComplianceService.formatWWCC(wwccNumber, state),
      state
    })
  }

  public async store({ request, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const payload = request.only([
        // 'user_id', // Don't allow setting arbitrary user_id
        'doc_type',
        'issued_at',
        'expires_at',
        'wwcc_number',
        'wwcc_state'
      ])

      // Validate WWCC if provided
      if (payload.doc_type === 'wwcc' && payload.wwcc_number && payload.wwcc_state) {
        const validation = ComplianceService.validateWWCC(
          payload.wwcc_number,
          payload.wwcc_state
        )

        if (!validation.valid) {
          return response.status(422).send({
            error: validation.message
          })
        }
      }

      // Normalize incoming ISO date strings to Luxon DateTime so Lucid converts them
      if (payload.issued_at) {
        const dt = DateTime.fromISO(String(payload.issued_at))
        if (dt.isValid) payload.issued_at = dt
        else delete payload.issued_at
      }
      if (payload.expires_at) {
        const dt2 = DateTime.fromISO(String(payload.expires_at))
        if (dt2.isValid) payload.expires_at = dt2
        else delete payload.expires_at
      }

      // handle optional file upload - Privacy Act compliant storage
      const file = request.file('file')
      const metadata = request.input('metadata') || {}

      if (file) {
        // Store in private location for Privacy Act compliance
        await file.moveToDisk('local', {
          dirname: 'compliance',
          visibility: 'private'
        } as any)

        // Store path and original filename in metadata
        metadata.file = {
          originalName: file.clientName,
          storedName: file.fileName,
          path: `compliance/${file.fileName}`
        }
      }

      // Add WWCC data to metadata
      if (payload.wwcc_number) {
        metadata.wwcc = {
          number: payload.wwcc_number,
          state: payload.wwcc_state,
          formatted: ComplianceService.formatWWCC(payload.wwcc_number, payload.wwcc_state)
        }
      }

      const createPayload: any = {
        ...payload,
        userId: user.id, // Enforce current user
        metadata,
        status: 'pending' // Always start as pending
      }

      const doc = await ComplianceDocument.create(createPayload)

      // Log compliance creation for audit
      await ComplianceService.logComplianceCheck(
        user.id,
        createPayload.doc_type,
        'pass',
        { action: 'document_created', docId: doc.id }
      )

      return response.created(doc)
    } catch (err) {
      Logger.error('ComplianceController.store failed: ' + String(err))
      return response
        .status(500)
        .send({ error: 'Failed to create compliance document', details: String(err) })
    }
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const doc = await ComplianceDocument.find(params.id)
    if (!doc) return response.notFound()
    
    if (doc.userId !== auth.user!.id) {
        return response.forbidden({ message: 'Access denied' })
    }

    return response.ok(doc)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    try {
      const doc = await ComplianceDocument.find(params.id)
      if (!doc) return response.notFound()

      if (doc.userId !== auth.user!.id) {
        return response.forbidden({ message: 'Access denied' })
    }

      const incoming = request.only(['doc_type', 'issued_at', 'expires_at']) // Removed status, user shouldn't verify own docs

      // Normalize incoming ISO date strings to Luxon DateTime objects
      if (incoming.issued_at) {
        const dt = DateTime.fromISO(String(incoming.issued_at))
        if (dt.isValid) incoming.issued_at = dt
        else delete incoming.issued_at
      }
      if (incoming.expires_at) {
        const dt2 = DateTime.fromISO(String(incoming.expires_at))
        if (dt2.isValid) incoming.expires_at = dt2
        else delete incoming.expires_at
      }

      // handle optional file upload
      const file = request.file('file')
      const metadata = request.input('metadata') || doc.metadata || {}
      if (file) {
        await file.moveToDisk('local', { dirname: 'compliance' })
        metadata.file = {
          originalName: file.clientName,
          storedName: file.fileName,
          path: `compliance/${file.fileName}`
        }
      }

      incoming['metadata'] = metadata
      // Reset status to pending on update
      incoming['status'] = 'pending'
      
      doc.merge(incoming)
      await doc.save()
      return response.ok(doc)
    } catch (err) {
      Logger.error('ComplianceController.update failed: ' + String(err))
      return response
        .status(500)
        .send({ error: 'Failed to update compliance document', details: String(err) })
    }
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const doc = await ComplianceDocument.find(params.id)
    if (!doc) return response.notFound()
    
    if (doc.userId !== auth.user!.id) {
        return response.forbidden({ message: 'Access denied' })
    }

    await doc.delete()
    return response.noContent()
  }
  public async remind({ response }: HttpContextContract) {
    // Logic to send compliance reminder
    return response.ok({ message: 'Compliance reminder sent' })
  }

  public async file({ params, response }: HttpContextContract) {
    const doc = await ComplianceDocument.find(params.id)
    if (!doc) return response.notFound()

    const metadata = doc.metadata || {}
    const fileMeta = metadata.file
    if (!fileMeta || !fileMeta.path) return response.notFound()

    const filePath: string = fileMeta.path
    try {
      // Try to get a public URL from Drive (works for local with serveFiles and S3)
      try {
        const url = await Drive.getUrl(filePath)
        // Redirect client to the storage URL (or return it)
        return response.redirect(url)
      } catch (e) {
        // If Drive.getUrl is not available or fails, attempt to stream the file
      }

      // Fallback: stream the file contents
      const stream = await Drive.getStream(filePath)
      response.header('Content-Type', 'application/octet-stream')
      return response.stream(stream)
    } catch (err) {
      Logger.error('Failed to serve compliance file: ' + String(err))
      return response.status(500).send({ error: 'Failed to serve file', details: String(err) })
    }
  }
}
