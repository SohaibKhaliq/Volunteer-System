import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ComplianceDocument from 'App/Models/ComplianceDocument'
import { DateTime } from 'luxon'
import Drive from '@ioc:Adonis/Core/Drive'
import Logger from '@ioc:Adonis/Core/Logger'
import ComplianceService from 'App/Services/ComplianceService'

export default class ComplianceController {
  public async index({ response }: HttpContextContract) {
    const docs = await ComplianceDocument.query().preload('user')
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
      const payload = request.only([
        'user_id',
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

      payload['metadata'] = metadata

      // Set initial status
      if (!payload['status']) {
        payload['status'] = 'pending'
      }

      const doc = await ComplianceDocument.create(payload)

      // Log compliance creation for audit
      await ComplianceService.logComplianceCheck(
        payload.user_id,
        payload.doc_type,
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

  public async show({ params, response }: HttpContextContract) {
    const doc = await ComplianceDocument.find(params.id)
    if (!doc) return response.notFound()
    return response.ok(doc)
  }

  public async update({ params, request, response }: HttpContextContract) {
    try {
      const doc = await ComplianceDocument.find(params.id)
      if (!doc) return response.notFound()

      const incoming = request.only(['doc_type', 'issued_at', 'expires_at', 'status'])

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

  public async destroy({ params, response }: HttpContextContract) {
    const doc = await ComplianceDocument.find(params.id)
    if (!doc) return response.notFound()
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
