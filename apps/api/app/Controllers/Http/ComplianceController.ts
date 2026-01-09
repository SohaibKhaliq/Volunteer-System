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

  public async getTypes({ auth, response }: HttpContextContract) {
    const user = auth.user!

    // 1. System Defaults
    const systemTypes = [
      {
        label: 'Background Check',
        value: 'background_check',
        isMandatory: false,
        source: 'system'
      },
      {
        label: 'WWCC (Working with Children Check)',
        value: 'wwcc',
        isMandatory: true,
        source: 'system'
      },
      { label: 'Police Check', value: 'police_check', isMandatory: false, source: 'system' },
      { label: 'Certification', value: 'certification', isMandatory: false, source: 'system' },
      { label: 'Other', value: 'other', isMandatory: false, source: 'system' }
    ]

    // 2. Fetch Organization Requirements
    // Get all requirements from all organizations (simplification for MVP: user sees all possible requirements)
    // Ideally, we filter by organizations the user has applied to or joined.
    const ComplianceRequirement = (await import('App/Models/ComplianceRequirement')).default
    const reqs = await ComplianceRequirement.query().preload('organization')

    const orgTypes = reqs.map((r) => ({
      label: `${r.name} (${r.organization?.name || 'Org Requirement'})`,
      value: r.id.toString(), // Use ID as value for specific requirements, or we can use a composite key
      // actually, to keep it simple for the "doc_type" column which is string:
      // if it's a known type (like 'certification'), we might want to group it.
      // But the user request implies "dynamic types" appearing in the dropdown.
      // So we will use the requirement name as the type, or a special prefix.
      // Let's use "req_<id>" and store the link in metadata, OR just use the 'docType' field
      // of the requirement if it aligns with system types.
      //
      // BETTER APPROACH: The Requirement entity defines *what* is needed.
      // The `docType` in the dropdown should probably be the *kind* of document (e.g. "Certificate").
      // But the user wants "Types... defined by Admin and Organization".
      // So we will return specific requirement names as selectable "Types".
      value: `req_${r.id}`,
      originalType: r.docType,
      isMandatory: r.isMandatory,
      source: r.organization?.name || 'Organization'
    }))

    return response.ok({
      system: systemTypes,
      organization: orgTypes
    })
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
      // Basic payload
      const payload = request.only([
        // 'user_id', // Don't allow setting arbitrary user_id
        'doc_type',
        'issued_at',
        'expires_at',
        'wwcc_number',
        'wwcc_state',
        'organization_id',
        'target_user_id'
      ])

      // Step 1: Resolve Organization Context
      const OrganizationTeamMember = (await import('App/Models/OrganizationTeamMember')).default
      const OrganizationModel = (await import('App/Models/Organization')).default

      const memberships = await OrganizationTeamMember.query().where('user_id', user.id)

      const providedOrgId = payload.organization_id || payload.organizationId || null

      if (!providedOrgId) {
        if (memberships.length === 0) {
          return response.badRequest({ error: 'No organization associated with this user.' })
        }
        if (memberships.length > 1) {
          return response.badRequest({
            error: 'Multiple organizations found. Please provide an organization ID.'
          })
        }
      }

      // If organization id not provided but user has single membership, use that org
      const resolvedOrgId = providedOrgId ? Number(providedOrgId) : memberships[0].organizationId

      // Validate organization exists
      const org = await OrganizationModel.find(resolvedOrgId)
      if (!org) return response.badRequest({ error: 'Provided organization not found.' })

      // Validate user belongs to organization (membership may not exist if volunteer only)
      const membership = memberships.find((m) => m.organizationId === Number(resolvedOrgId)) || null

      // Step 2: Resolve User Role (Authorization Gate)
      // Roles: ADMIN, ORGANIZATION_MEMBER, VOLUNTEER
      let role: 'ADMIN' | 'ORGANIZATION_MEMBER' | 'VOLUNTEER' = 'VOLUNTEER'
      if (membership) {
        const r = String(membership.role || '').toLowerCase()
        if (r.includes('admin') || r.includes('owner')) role = 'ADMIN'
        else role = 'ORGANIZATION_MEMBER'
      } else {
        // No membership -> treat as volunteer (own documents only)
        role = 'VOLUNTEER'
      }

      // Step 3: Enforce Document Upload Rules by Role
      const docType = payload.doc_type || payload.docType
      if (!docType) return response.badRequest({ error: 'document_type (doc_type) is required.' })

      // Build dynamic allowed types for volunteers + organization requirements
      const ComplianceRequirement = (await import('App/Models/ComplianceRequirement')).default
      const systemBaseTypes = ['background_check', 'wwcc', 'police_check', 'certification', 'other']

      // Fetch requirements that are either global (organization_id IS NULL) or belong to the resolved org
      const reqs = await ComplianceRequirement.query().where((q) => {
        q.whereNull('organization_id')
        if (resolvedOrgId) q.orWhere('organization_id', resolvedOrgId)
      })

      // Allowed set includes system base types and requirement tokens like `req_<id>`
      const volunteerAllowed = new Set<string>(systemBaseTypes)
      for (const r of reqs) {
        volunteerAllowed.add(`req_${r.id}`)
        // also include the raw docType if the requirement maps to an existing docType string
        if (r.docType) volunteerAllowed.add(r.docType)
      }

      // Determine target user (who the document is for)
      const targetUserId = payload.target_user_id || payload.targetUserId || null

      // Validation rules
      if (role === 'VOLUNTEER') {
        // Volunteers can only upload their own personal documents
        if (targetUserId && Number(targetUserId) !== user.id) {
          return response.forbidden({
            error: 'Volunteers may only upload documents for themselves.'
          })
        }

        // Document type must be volunteer-allowed or a valid organization requirement token (req_<id>)
        const dt = String(docType)
        if (volunteerAllowed.has(dt)) {
          // allowed
        } else if (dt.startsWith('req_')) {
          const parts = dt.split('_')
          const rid = Number(parts[1])
          const found = reqs.find((r) => r.id === rid)
          if (!found)
            return response.forbidden({
              error: 'Referenced requirement not found or not available.'
            })
        } else {
          return response.forbidden({ error: 'Document type not allowed for volunteer uploads.' })
        }
      }

      if (role === 'ORGANIZATION_MEMBER') {
        // Organization members can upload organization-specific documents only
        // They cannot upload other volunteers' personal documents
        if (targetUserId && Number(targetUserId) !== user.id) {
          return response.forbidden({
            error: 'Organization members cannot upload personal documents for other volunteers.'
          })
        }
        // Must specify organization_id (we have resolved it already)
      }

      if (role === 'ADMIN') {
        // Admins can upload organization-wide docs and volunteer docs on behalf of others
        // Ensure organization_id is provided (admins must specify scope)
        if (!resolvedOrgId) {
          return response.badRequest({ error: 'organization_id is required for admin uploads.' })
        }
      }

      // Validate WWCC if provided
      if (payload.doc_type === 'wwcc' && payload.wwcc_number && payload.wwcc_state) {
        const validation = ComplianceService.validateWWCC(payload.wwcc_number, payload.wwcc_state)

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
      const file = request.file('file', {
        size: '10mb',
        extnames: ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx']
      })
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

      // Step 4: Validation Before Upload already performed above
      // Step 5: Execute Upload – build explicit create payload to avoid accepting arbitrary fields
      const finalUserId = role === 'ADMIN' && targetUserId ? Number(targetUserId) : user.id

      const createPayload: any = {
        doc_type: String(docType),
        issued_at: payload.issued_at,
        expires_at: payload.expires_at,
        userId: finalUserId, // Enforce ownership according to role rules
        organizationId: resolvedOrgId || null,
        metadata,
        status: 'pending' // Always start as pending
      }

      const doc = await ComplianceDocument.create(createPayload)

      // Log compliance creation for audit
      await ComplianceService.logComplianceCheck(user.id, createPayload.doc_type, 'pass', {
        action: 'document_created',
        docId: doc.id
      })

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
      const user = auth.user!

      // Resolve memberships for the authenticated user
      const OrganizationTeamMember = (await import('App/Models/OrganizationTeamMember')).default
      const memberships = await OrganizationTeamMember.query().where('user_id', user.id)

      // Determine membership for the document's organization (if any)
      const docOrgId = doc.organizationId || null
      const membershipForDoc =
        memberships.find((m) => m.organizationId === Number(docOrgId)) || null

      // Resolve role relative to this document/org
      let role: 'ADMIN' | 'ORGANIZATION_MEMBER' | 'VOLUNTEER' = 'VOLUNTEER'
      if (membershipForDoc) {
        const r = String(membershipForDoc.role || '').toLowerCase()
        if (r.includes('admin') || r.includes('owner')) role = 'ADMIN'
        else role = 'ORGANIZATION_MEMBER'
      } else {
        role = 'VOLUNTEER'
      }

      // Authorization checks mirroring store()
      if (role === 'VOLUNTEER') {
        if (doc.userId !== user.id) {
          return response.forbidden({ error: 'Volunteers may only modify their own documents.' })
        }
      }

      if (role === 'ORGANIZATION_MEMBER') {
        if (!docOrgId || Number(docOrgId) !== Number(membershipForDoc!.organizationId)) {
          return response.forbidden({
            error: 'Organization members can only modify documents for their organization.'
          })
        }
        if (doc.userId !== user.id) {
          return response.forbidden({
            error: 'Organization members cannot modify personal documents of other volunteers.'
          })
        }
      }

      if (role === 'ADMIN') {
        // Admins must either be system admins or have an admin membership for the document's organization
        if (!user.isAdmin) {
          if (!membershipForDoc) {
            return response.forbidden({
              error: 'Admin privileges required to modify this document.'
            })
          }
          const r = String(membershipForDoc.role || '').toLowerCase()
          if (!r.includes('admin') && !r.includes('owner')) {
            return response.forbidden({
              error: 'Admin privileges required to modify this document.'
            })
          }
        }
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
      const file = request.file('file', {
        size: '10mb',
        extnames: ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx']
      })
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

    const user = auth.user!
    const OrganizationTeamMember = (await import('App/Models/OrganizationTeamMember')).default
    const memberships = await OrganizationTeamMember.query().where('user_id', user.id)

    const docOrgId = doc.organizationId || null
    const membershipForDoc = memberships.find((m) => m.organizationId === Number(docOrgId)) || null

    let role: 'ADMIN' | 'ORGANIZATION_MEMBER' | 'VOLUNTEER' = 'VOLUNTEER'
    if (membershipForDoc) {
      const r = String(membershipForDoc.role || '').toLowerCase()
      if (r.includes('admin') || r.includes('owner')) role = 'ADMIN'
      else role = 'ORGANIZATION_MEMBER'
    } else {
      role = 'VOLUNTEER'
    }

    if (role === 'VOLUNTEER') {
      if (doc.userId !== user.id) {
        return response.forbidden({ error: 'Volunteers may only delete their own documents.' })
      }
    }

    if (role === 'ORGANIZATION_MEMBER') {
      if (!docOrgId || Number(docOrgId) !== Number(membershipForDoc!.organizationId)) {
        return response.forbidden({
          error: 'Organization members can only delete documents for their organization.'
        })
      }
      if (doc.userId !== user.id) {
        return response.forbidden({
          error: 'Organization members cannot delete personal documents of other volunteers.'
        })
      }
    }

    if (role === 'ADMIN') {
      if (!user.isAdmin) {
        if (!membershipForDoc) {
          return response.forbidden({ error: 'Admin privileges required to delete this document.' })
        }
        const r = String(membershipForDoc.role || '').toLowerCase()
        if (!r.includes('admin') && !r.includes('owner')) {
          return response.forbidden({ error: 'Admin privileges required to delete this document.' })
        }
      }
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
      // Check if file exists before attempting to stream
      const exists = await Drive.exists(filePath)
      if (!exists) {
        Logger.warn(`Compliance file not found: ${filePath}`)
        return response.notFound({ error: 'File not found on disk' })
      }

      // Stream the file contents directly
      const stream = await Drive.getStream(filePath)
      response.header('Content-Type', 'application/octet-stream')
      response.header(
        'Content-Disposition',
        `attachment; filename="${fileMeta.originalName || 'document'}"`
      )
      return response.stream(stream)
    } catch (err) {
      Logger.error('Failed to serve compliance file: ' + String(err))
      return response.status(500).send({ error: 'Failed to serve file', details: String(err) })
    }
  }
}
