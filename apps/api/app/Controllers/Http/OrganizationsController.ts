import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import Event from 'App/Models/Event'
import Opportunity from 'App/Models/Opportunity'
import VolunteerHour from 'App/Models/VolunteerHour'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'
import Logger from '@ioc:Adonis/Core/Logger'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import Resource from 'App/Models/Resource'
import CreateOrganizationValidator from 'App/Validators/CreateOrganizationValidator'

export default class OrganizationsController {
  public async index({ response, request }: HttpContextContract) {
    const { withCounts, withCompliance, withPerformance } = request.qs()
    // Treat withPerformance as enabled by default when not specified so API consumers
    // that expect a performance_score do not need to opt-in. Allow callers to
    // explicitly disable withPerformance=false.
    const computePerformance =
      typeof withPerformance === 'undefined' ? true : String(withPerformance) === 'true'

    const query = Organization.query()

    const orgs = await query

    const mapOrg = async (org: Organization) => {
      const payload: any = org.toJSON()
      if (payload.logo) {
        const urls = await org.resolveLogoUrls()
        payload.logo = urls.logo
        payload.logo_thumb = urls.logo_thumb
      }
      if (withCounts === 'true') {
        payload.volunteer_count = await org.getVolunteerCount()
        payload.event_count = await org.getEventCount()
      }
      // Optionally include a small performance score metric (0-100) for admin lists
      // based on retention rate and other basic analytics. Keep this cheap by
      // using the analytics helper which aggregates counts and retention.
      if (computePerformance) {
        try {
          const analytics = await org.getAnalytics()
          // Combine a few simple signals into a single 0-100 performance score:
          // - retentionRate (0-100) (weight 50%)
          // - totalHours normalized to a baseline (weight 30%)
          // - eventCount normalized to a baseline (weight 20%)
          const retention = Number(analytics.retentionRate || 0)
          const totalHours = Number(analytics.totalHours || 0)
          const eventCount = Number(analytics.eventCount || 0)

          // Baselines (tunable): treat 100 hours and 10 events as '100' for normalization
          const HOURS_BASELINE = 100
          const EVENTS_BASELINE = 10

          const hoursScore = Math.min(100, Math.round((totalHours / HOURS_BASELINE) * 100))
          const eventsScore = Math.min(100, Math.round((eventCount / EVENTS_BASELINE) * 100))

          const combined = Math.round(retention * 0.5 + hoursScore * 0.3 + eventsScore * 0.2)
          payload.performance_score = Number.isFinite(combined) ? combined : null
        } catch (e) {
          payload.performance_score = null
        }
      }
      // optionally include a precomputed compliance score (percentage)
      if (withCompliance === 'true') {
        try {
          // best-effort: compute compliant docs vs total docs for this org
          const now = new Date().toISOString()
          const rows: any = await Database.from('compliance_documents as cd')
            .join('organization_volunteers as ov', 'cd.user_id', 'ov.user_id')
            .where('ov.organization_id', org.id)
            .groupBy('ov.organization_id')
            .select('ov.organization_id')
            .count('cd.id as total')
            .select(
              Database.raw(
                "SUM(CASE WHEN cd.status = 'approved' AND (cd.expires_at IS NULL OR cd.expires_at > ?) THEN 1 ELSE 0 END) as valid",
                [now]
              )
            )

          const info = Array.isArray(rows) && rows[0] ? rows[0] : null
          const total = info ? Number(info.total || 0) : 0
          const valid = info ? Number(info.valid || 0) : 0
          payload.compliance_score = total > 0 ? Math.round((valid / total) * 100) : null
        } catch (e) {
          payload.compliance_score = null
        }
      }
      return payload
    }

    // support both array results and paginator objects
    if (Array.isArray(orgs)) {
      const mapped = await Promise.all(orgs.map(mapOrg))
      return response.ok(mapped)
    }

    // assume paginator-like object { data: [...], meta: {...} }
    if (orgs && (orgs as any).data) {
      const data = await Promise.all((orgs as any).data.map(mapOrg))
      const out = { ...(orgs as any), data }
      return response.ok(out)
    }

    // fallback
    return response.ok(orgs)
  }

  /**
   * Return resources for a specific organization (admin view)
   */
  public async getResources({ auth, params, request, response }: HttpContextContract) {
    const page = Number(request.qs().page || 1)
    const perPage = Number(request.qs().perPage || 20)
    const orgId = params.id
    const org = await Organization.find(orgId)
    if (!org) return response.notFound()

    // Security Check
    const user = auth.user!
    // allow generic admin access implies team member logic usually, but here checking specifically
    const isTeam = await OrganizationTeamMember.query()
      .where('organization_id', org.id)
      .where('user_id', user.id)
      .first()
    const isVolunteer = await Database.from('organization_volunteers')
      .where('organization_id', org.id)
      .where('user_id', user.id)
      .where('status', 'active')
      .first()

    // Also allow global admins if needed, but for now strict org check
    if (!isTeam && !isVolunteer) {
      return response.forbidden({ message: 'Access denied' })
    }

    const query = Resource.query().where('organization_id', org.id).whereNull('deleted_at')
    const pag = await query.paginate(page, perPage)
    return response.ok(pag)
  }

  /**
   * Return resources for the current user's organization (org panel)
   */
  public async organizationResources({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const { organizationId, membership } = await this.resolveOrganizationForUser(user, request)

    if (!organizationId) {
      return response.notFound({ message: 'Organization not found' })
    }

    if (!user.isAdmin && !membership) {
      return response.forbidden({ message: 'User is not part of this organization' })
    }

    const page = Number(request.qs().page || 1)
    const perPage = Number(request.qs().perPage || 20)

    const query = Resource.query().where('organization_id', organizationId).whereNull('deleted_at')
    const pag = await query.paginate(page, perPage)
    return response.ok(pag)
  }

  public async store({ request, response }: HttpContextContract) {
    await request.validate(CreateOrganizationValidator)

    const payload: any = request.only(['name', 'description', 'contact_email', 'contact_phone'])

    // handle optional logo upload similar to update()
    try {
      const logoFile = request.file('logo')
      if (logoFile) {
        await logoFile.moveToDisk('local', { dirname: 'organizations' })
        const filename = logoFile.fileName
        const tmpRoot = Application.tmpPath('uploads')
        const candidates = [
          `${tmpRoot}/organizations/${filename}`,
          `${tmpRoot}/local/organizations/${filename}`,
          `${tmpRoot}/local/${filename}`,
          `${tmpRoot}/${filename}`
        ]

        let found: string | null = null
        for (const c of candidates) {
          if (fs.existsSync(c)) {
            found = c
            break
          }
        }

        const dest = `${tmpRoot}/organizations/${filename}`
        if (!fs.existsSync(`${tmpRoot}/organizations`)) {
          fs.mkdirSync(`${tmpRoot}/organizations`, { recursive: true })
        }

        if (found && found !== dest) {
          try {
            fs.renameSync(found, dest)
          } catch (err) {
            Logger.warn(`Failed to move uploaded logo from ${found} to ${dest}: ${String(err)}`)
          }
        }

        payload.logo = `organizations/${filename}`
        Logger.info(`Saved org logo to uploads (local/${logoFile.fileName})`)

        // Attempt to generate a thumbnail (200x200) next to original
        try {
          const dest = `${tmpRoot}/organizations/${filename}`
          const thumbDir = `${tmpRoot}/organizations/thumbs`
          if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true })
          const thumbPath = `${thumbDir}/${filename}`
          const maybeSharp = await import('sharp').catch(() => null)
          const sharpLib = maybeSharp ? (maybeSharp.default ?? maybeSharp) : null
          if (sharpLib) {
            await sharpLib(dest).resize(200, 200, { fit: 'cover' }).toFile(thumbPath)
            Logger.info(`Generated thumbnail for org logo: ${thumbPath}`)
          } else {
            Logger.info('Skipping thumbnail generation: sharp not available')
          }
        } catch (err) {
          Logger.warn(`Failed to generate thumbnail for org logo: ${String(err)}`)
        }
      }
    } catch (err) {
      Logger.error('Error saving organization logo: ' + String(err))
    }

    const org = await Organization.create(payload)

    // prepare payload with logo urls using model helper
    const out: any = org.toJSON()
    try {
      const urls = await org.resolveLogoUrls()
      out.logo = urls.logo
      out.logo_thumb = urls.logo_thumb
    } catch (e) {
      out.logo_thumb = null
    }

    return response.created(out)
  }

  public async show({ auth, params, request, response }: HttpContextContract) {
    // Support two uses:
    // - GET /organizations/:id -> admin/resource-style lookup by id (params.id)
    // - GET /organization/profile -> when no id provided, return the current user's organization

    // If an id param is present, only system admins may access arbitrary organizations
    if (params?.id) {
      const user = auth.user
      // If no user is logged in, or user is not admin and lacks permission
      if (!user || (!user.isAdmin && !(await user.can("view_organizations")))) {
        return response.forbidden({ message: 'Admin access required' })
      }
      const org = await Organization.find(params.id)
      if (!org) return response.notFound()
      // normalize keys for frontend convenience
      const payload: any = org.toJSON()
      payload.email = payload.contactEmail ?? payload.email ?? payload.contact_email
      payload.phone = payload.contactPhone ?? payload.phone ?? payload.contact_phone
      payload.website = payload.website ?? null
      payload.address = payload.address ?? null
      payload.type = payload.type ?? null
      payload.logo = payload.logo ?? null
      payload.public_profile = payload.public_profile ?? payload.publicProfile ?? false
      payload.publicProfile = payload.public_profile
      payload.auto_approve_volunteers =
        payload.auto_approve_volunteers ?? payload.autoApproveVolunteers ?? false
      payload.autoApproveVolunteers = payload.auto_approve_volunteers
      // Resolve logo and thumbnail URLs via model helper
      try {
        const urls = await org.resolveLogoUrls()
        payload.logo = urls.logo
        payload.logo_thumb = urls.logo_thumb
      } catch (e) {
        // ignore and return stored values
      }
      return response.ok(payload)
    }

    // Otherwise, resolve the organization for the authenticated user (org panel)
    const user = auth.user!
    const {
      organizationId,
      membership,
      multipleMemberships,
      hasMembership,
      invalidOrganizationName
    } = await this.resolveOrganizationForUser(user, request)

    if (!organizationId) {
      if (invalidOrganizationName) {
        return response.badRequest({
          message: 'Provided organizationName not found or not associated with your account.'
        })
      }
      if (multipleMemberships) {
        return response.badRequest({
          message: 'Multiple organizations found. Provide organizationName.'
        })
      }
      if (!hasMembership && !user.isAdmin) {
        return response.notFound({ message: 'User is not part of any organization' })
      }
      return response.badRequest({ message: 'organizationName is required' })
    }

    if (!user.isAdmin && (!membership || membership.organizationId !== organizationId)) {
        if (!(await user.can('view_organizations'))) {
            return response.forbidden({ message: 'You do not have permission to view this organization' })
        }
    }

    const org = await Organization.find(organizationId)
    if (!org) return response.notFound()

    // Include counts
    const volunteerCount = await org.getVolunteerCount()
    const eventCount = await org.getEventCount()

    const payload: any = {
      ...org.toJSON(),
      volunteer_count: volunteerCount,
      event_count: eventCount
    }
    // provide easy keys which frontend expects
    payload.email = payload.contactEmail ?? payload.email
    payload.phone = payload.contactPhone ?? payload.phone
    payload.website = payload.website ?? null
    payload.address = payload.address ?? null
    payload.type = payload.type ?? null
    payload.logo = payload.logo ?? null
    payload.public_profile = payload.public_profile ?? payload.publicProfile ?? false
    payload.publicProfile = payload.public_profile
    payload.auto_approve_volunteers =
      payload.auto_approve_volunteers ?? payload.autoApproveVolunteers ?? false
    payload.autoApproveVolunteers = payload.auto_approve_volunteers
    // Resolve logo and thumbnail URLs via model helper
    try {
      const urls = await org.resolveLogoUrls()
      payload.logo = urls.logo
      payload.logo_thumb = urls.logo_thumb
    } catch (e) {
      // ignore
    }

    return response.ok(payload)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    // Support two uses:
    // - PUT /organizations/:id -> resource-style update by id
    // - PUT /organization/profile -> update the current user's organization

    let org: Organization | null = null

    if (params?.id) {
      const user = auth.user!
      if (!user.isAdmin && !(await user.can("edit_organizations"))) {
        return response.forbidden({ message: 'Admin access required' })
      }
      org = await Organization.find(params.id)
      if (!org) return response.notFound()
    } else {
      const user = auth.user!
      const {
        organizationId,
        membership,
        multipleMemberships,
        hasMembership,
        invalidOrganizationName
      } = await this.resolveOrganizationForUser(user, request)

      if (!organizationId) {
        if (invalidOrganizationName) {
          return response.badRequest({
            message: 'Provided organizationName not found or not associated with your account.'
          })
        }
        if (multipleMemberships) {
          return response.badRequest({
            message: 'Multiple organizations found. Provide organizationName.'
          })
        }
        if (!hasMembership && !user.isAdmin) {
          return response.notFound({ message: 'User is not part of any organization' })
        }
        return response.badRequest({ message: 'organizationName is required' })
      }

      if (!user.isAdmin && (!membership || membership.organizationId !== organizationId)) {
        if (!(await user.can('edit_organizations'))) {
            return response.forbidden({
            message: 'You do not have permission to update this organization'
            })
        }
      }

      org = await Organization.find(organizationId)
      if (!org) return response.notFound()
    }
    // Accept both camel/cased frontend keys and DB-style keys.
    const body: any = request.only([
      'name',
      'description',
      'contact_email',
      'contact_phone',
      'email',
      'phone',
      'website',
      'address',
      'type',
      'logo',
      'public_profile',
      'auto_approve_volunteers',
      'is_approved',
      'is_active',
      'publicProfile', // Explicitly allow camelCase
      'autoApproveVolunteers' // Explicitly allow camelCase
    ])
    // Logger.info(`Update Organization Body: ${JSON.stringify(body)}`)

    // Normalize keys to model property names
    if (body.email) body.contactEmail = body.email
    if (body.phone) body.contactPhone = body.phone

    // Map snake_case request keys as well
    if (body.contact_email) body.contactEmail = body.contact_email
    if (body.contact_phone) body.contactPhone = body.contact_phone

    // map settings keys
    if (Object.prototype.hasOwnProperty.call(body, 'public_profile'))
      body.publicProfile = body.public_profile
    if (Object.prototype.hasOwnProperty.call(body, 'auto_approve_volunteers'))
      body.autoApproveVolunteers = body.auto_approve_volunteers

    // if a file was uploaded, handle saving it first
    const updateData: any = {}
    try {
      // capture previous logo so we can remove files when replaced
      const previousLogo = org?.logo
      const logoFile = request.file('logo')
      if (logoFile) {
        await logoFile.moveToDisk('local', { dirname: 'organizations' })
        // moveToDisk stores the uploaded name in logoFile.fileName.
        // We try to ensure the file is placed under the API uploads folder as /uploads/organizations/<file>
        const filename = logoFile.fileName
        const tmpRoot = Application.tmpPath('uploads')
        // possible locations where moveToDisk may have placed the file
        const candidates = [
          `${tmpRoot}/organizations/${filename}`,
          `${tmpRoot}/local/organizations/${filename}`,
          `${tmpRoot}/local/${filename}`,
          `${tmpRoot}/${filename}`
        ]

        let found: string | null = null
        for (const c of candidates) {
          if (fs.existsSync(c)) {
            found = c
            break
          }
        }

        // Ensure final destination under tmpRoot/organizations/<filename>
        const dest = `${tmpRoot}/organizations/${filename}`
        if (!fs.existsSync(`${tmpRoot}/organizations`)) {
          fs.mkdirSync(`${tmpRoot}/organizations`, { recursive: true })
        }

        if (found && found !== dest) {
          try {
            fs.renameSync(found, dest)
          } catch (err) {
            Logger.warn(`Failed to move uploaded logo from ${found} to ${dest}: ${String(err)}`)
          }
        }

        // store path relative to disk root so Drive.getUrl('organizations/<file>') resolves
        updateData.logo = `organizations/${filename}`
        Logger.info(`Saved org logo to uploads (local/${logoFile.fileName})`)

        // Generate thumbnail for updated logo as well
        try {
          const destPath = `${tmpRoot}/organizations/${filename}`
          const thumbDir = `${tmpRoot}/organizations/thumbs`
          if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true })
          const thumbPath = `${thumbDir}/${filename}`
          const maybeSharp = await import('sharp').catch(() => null)
          const sharpLib = maybeSharp ? (maybeSharp.default ?? maybeSharp) : null
          if (sharpLib) {
            await sharpLib(destPath).resize(200, 200, { fit: 'cover' }).toFile(thumbPath)
            Logger.info(`Generated thumbnail for updated org logo: ${thumbPath}`)
          } else {
            Logger.info('Skipping thumbnail generation for update: sharp not available')
          }
        } catch (err) {
          Logger.warn(`Failed to generate thumbnail for updated org logo: ${String(err)}`)
        }

        // delete previous logo files if they differ
        try {
          if (previousLogo && previousLogo !== updateData.logo) {
            await Organization.deleteLogoFilesFor(previousLogo)
          }
        } catch (e) {
          Logger.warn(`Failed to delete previous org logo files: ${String(e)}`)
        }
      }
    } catch (err) {
      Logger.error('Error saving organization logo: ' + String(err))
    }

    // Merge only provided keys to avoid clobbering existing data with undefined
    const setIf = (key: string, mappedKey?: string) => {
      if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
        updateData[mappedKey ?? key] = body[key]
      }
    }

    const parseBoolean = (v: any): boolean | undefined => {
      if (v === undefined || v === null) return undefined
      if (typeof v === 'boolean') return v
      if (typeof v === 'number') return v === 1
      if (typeof v === 'string') {
        const lower = v.trim().toLowerCase()
        if (lower === 'true' || lower === '1') return true
        if (lower === 'false' || lower === '0') return false
      }
      return undefined
    }

    setIf('name')
    setIf('description')
    // contact email/phone can come in multiple shapes
    setIf('contactEmail')
    setIf('contactPhone')
    setIf('contact_email', 'contactEmail')
    setIf('contact_phone', 'contactPhone')
    setIf('email', 'contactEmail')
    setIf('phone', 'contactPhone')

    setIf('website')
    setIf('address')
    setIf('type')
    setIf('logo')
    // boolean flags should be coerced to proper booleans (incoming FormData may carry 'true'/'false' strings)
    if (Object.prototype.hasOwnProperty.call(body, 'publicProfile')) {
      const parsed = parseBoolean(body.publicProfile)
      if (parsed !== undefined) updateData.publicProfile = parsed
      else updateData.publicProfile = body.publicProfile
    }
    if (Object.prototype.hasOwnProperty.call(body, 'autoApproveVolunteers')) {
      const parsed = parseBoolean(body.autoApproveVolunteers)
      if (parsed !== undefined) updateData.autoApproveVolunteers = parsed
      else updateData.autoApproveVolunteers = body.autoApproveVolunteers
    }

    if (Object.prototype.hasOwnProperty.call(body, 'is_approved'))
      updateData.isApproved = body.is_approved
    if (Object.prototype.hasOwnProperty.call(body, 'is_active'))
      updateData.isActive = body.is_active
    if (Object.prototype.hasOwnProperty.call(body, 'isApproved'))
      updateData.isApproved = body.isApproved
    if (Object.prototype.hasOwnProperty.call(body, 'isActive')) updateData.isActive = body.isActive

    org.merge(updateData)
    await org.save()

    // Return normalized payload so frontend sees consistent keys
    const payload: any = org.toJSON()
    payload.email = payload.contactEmail ?? payload.email ?? payload.contact_email
    payload.phone = payload.contactPhone ?? payload.phone ?? payload.contact_phone
    payload.website = payload.website ?? null
    payload.address = payload.address ?? null
    payload.type = payload.type ?? null
    payload.logo = payload.logo ?? null
    payload.public_profile = payload.public_profile ?? payload.publicProfile ?? false
    payload.publicProfile = payload.public_profile
    payload.auto_approve_volunteers =
      payload.auto_approve_volunteers ?? payload.autoApproveVolunteers ?? false
    payload.autoApproveVolunteers = payload.auto_approve_volunteers
    // Resolve logo and thumbnail using model helper
    try {
      const urls = await org.resolveLogoUrls()
      payload.logo = urls.logo
      payload.logo_thumb = urls.logo_thumb
    } catch (e) {
      // ignore errors
    }

    return response.ok(payload)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound()
    await org.delete()
    return response.noContent()
  }

  /**
   * Get all volunteers for an organization
   */
  public async getVolunteers({ auth, params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const user = auth.user!
    
    // Check if user is part of the org or has global permission
    const isMember = await OrganizationTeamMember.query()
      .where('organization_id', org.id)
      .where('user_id', user.id)
      .first()

    if (!user.isAdmin && !isMember) {
        const canView = (await user.can('view_users')) || (await user.can('view_teams'))
        if (!canView) {
             return response.forbidden({ message: 'You do not have permission to view volunteers' })
        }
    }

    const { status, role, search, page = 1, limit = 20 } = request.qs()

    let query = Database.from('users')
      .join('organization_volunteers', 'users.id', 'organization_volunteers.user_id')
      .where('organization_volunteers.organization_id', org.id)
      .select(
        'users.*',
        'organization_volunteers.role as org_role',
        'organization_volunteers.status as org_status',
        'organization_volunteers.joined_at',
        'organization_volunteers.skills as skills'
      )

    // Filters
    if (status) {
      query = query.where('organization_volunteers.status', status)
    }
    if (role) {
      query = query.where('organization_volunteers.role', role)
    }
    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('users.first_name', `%${search}%`)
          .orWhereILike('users.last_name', `%${search}%`)
          .orWhereILike('users.email', `%${search}%`)
      })
    }

    const volunteers = await query.paginate(page, limit)

    // Add volunteer hours for each
    const volunteersWithStats = await Promise.all(
      volunteers.map(async (volunteer) => {
        const hoursResult = await Database.from('volunteer_hours')
          .where('user_id', volunteer.id)
          .where('status', 'approved')
          .sum('hours as total_hours')

        const eventsResult = await Database.from('assignments')
          .join('tasks', 'tasks.id', 'assignments.task_id')
          .where('assignments.user_id', volunteer.id)
          .whereNotNull('tasks.event_id')
          .countDistinct('tasks.event_id as event_count')

        // Normalize skills: could be JSON string or comma-separated
        let skills: string[] = []
        try {
          if (volunteer.skills) {
            if (typeof volunteer.skills === 'string') {
              try {
                const parsed = JSON.parse(volunteer.skills)
                if (Array.isArray(parsed)) skills = parsed
                else if (typeof parsed === 'string') skills = [parsed]
              } catch (e) {
                skills = String(volunteer.skills)
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              }
            } else if (Array.isArray(volunteer.skills)) {
              skills = volunteer.skills
            }
          }
        } catch (e) {
          skills = []
        }

        return {
          ...volunteer,
          skills,
          total_hours: hoursResult[0]?.total_hours || 0,
          events_attended: eventsResult[0]?.event_count || 0
        }
      })
    )

    return response.ok(volunteersWithStats)
  }

  /**
   * Add a volunteer to organization
   */
  public async addVolunteer({ params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const {
      user_id,
      role = 'volunteer',
      status = 'active',
      notes
    } = request.only(['user_id', 'role', 'status', 'notes'])

    const user = await User.find(user_id)
    if (!user) return response.notFound({ message: 'User not found' })

    // Check if already exists
    const existing = await Database.from('organization_volunteers')
      .where('organization_id', org.id)
      .where('user_id', user_id)
      .first()

    if (existing) {
      return response.conflict({ message: 'Volunteer already added to this organization' })
    }

    await org.related('volunteers').attach({
      [user_id]: {
        role,
        status,
        notes,
        joined_at: DateTime.now().toSQL()
      }
    })

    return response.created({ message: 'Volunteer added successfully' })
  }

  /**
   * Update volunteer role/status in organization
   */
  public async updateVolunteer({ params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const { userId } = params
    const { role, status, notes } = request.only(['role', 'status', 'notes'])

    const updateData: any = {}
    if (role) updateData.role = role
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    await Database.from('organization_volunteers')
      .where('organization_id', org.id)
      .where('user_id', userId)
      .update(updateData)

    return response.ok({ message: 'Volunteer updated successfully' })
  }

  /**
   * Remove volunteer from organization
   */
  public async removeVolunteer({ params, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const { userId } = params

    await org.related('volunteers').detach([userId])

    return response.ok({ message: 'Volunteer removed successfully' })
  }

  /**
   * Get organization events
   */
  public async getEvents({ auth, params, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    // Security Check: User must be a team member OR an active volunteer
    const user = auth.user!
    const isTeam = await OrganizationTeamMember.query()
      .where('organization_id', org.id)
      .where('user_id', user.id)
      .first()

    const isVolunteer = await Database.from('organization_volunteers')
      .where('organization_id', org.id)
      .where('user_id', user.id)
      .where('status', 'active')
      .first()

    if (!isTeam && !isVolunteer) {
        if (!(await user.can('view_events'))) {
             return response.forbidden({
                message: 'You must be a member of this organization to view its events'
             })
        }
    }

    const events = await Database.from('events')
      .where('organization_id', org.id)
      .orderBy('start_date', 'desc')

    // Add attendance for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const tasksResult = await Database.from('tasks')
          .where('event_id', event.id)
          .count('* as task_count')

        const assignmentsResult = await Database.from('assignments')
          .join('tasks', 'tasks.id', 'assignments.task_id')
          .where('tasks.event_id', event.id)
          .count('* as volunteer_count')

        return {
          ...event,
          task_count: tasksResult[0]?.task_count || 0,
          volunteer_count: assignmentsResult[0]?.volunteer_count || 0
        }
      })
    )

    return response.ok(eventsWithStats)
  }

  /**
   * Get organization tasks
   */
  public async getTasks({ auth, params, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const user = auth.user!
    const isTeam = await OrganizationTeamMember.query()
      .where('organization_id', org.id)
      .where('user_id', user.id)
      .first()
    const isVolunteer = await Database.from('organization_volunteers')
      .where('organization_id', org.id)
      .where('user_id', user.id)
      .where('status', 'active')
      .first()

    if (!isTeam && !isVolunteer) {
      return response.forbidden({ message: 'Access denied' })
    }

    const tasks = await Database.from('tasks')
      .join('events', 'events.id', 'tasks.event_id')
      .where('events.organization_id', org.id)
      .select('tasks.*', 'events.title as event_title')
      .orderBy('tasks.created_at', 'desc')

    // Add assignment counts
    const tasksWithAssignments = await Promise.all(
      tasks.map(async (task) => {
        const assignmentsResult = await Database.from('assignments')
          .where('task_id', task.id)
          .count('* as assignment_count')

        return {
          ...task,
          assignment_count: assignmentsResult[0]?.assignment_count || 0
        }
      })
    )

    return response.ok(tasksWithAssignments)
  }

  /**
   * Get volunteer hours for organization
   */
  public async getHours({ params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const { status, userId, startDate, endDate, page = 1, limit = 50 } = request.qs()

    let query = Database.from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .join('users', 'users.id', 'volunteer_hours.user_id')
      .where('organization_volunteers.organization_id', org.id)
      .select('volunteer_hours.*', 'users.first_name', 'users.last_name', 'users.email')
      .orderBy('volunteer_hours.date', 'desc')

    if (status) {
      query = query.where('volunteer_hours.status', status)
    }
    if (userId) {
      query = query.where('volunteer_hours.user_id', userId)
    }
    if (startDate) {
      query = query.where('volunteer_hours.date', '>=', startDate)
    }
    if (endDate) {
      query = query.where('volunteer_hours.date', '<=', endDate)
    }

    const hours = await query.paginate(page, limit)

    return response.ok(hours)
  }

  /**
   * Approve volunteer hours (bulk)
   */
  public async approveHours({ params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const { hour_ids, status = 'approved', notes } = request.only(['hour_ids', 'status', 'notes'])

    if (!Array.isArray(hour_ids) || hour_ids.length === 0) {
      return response.badRequest({ message: 'hour_ids must be a non-empty array' })
    }

    const updateData: any = { status }
    if (notes) updateData.notes = notes

    await Database.from('volunteer_hours').whereIn('id', hour_ids).update(updateData)

    return response.ok({ message: `${hour_ids.length} hours ${status}` })
  }

  /**
   * Get organization analytics
   */
  public async getAnalytics({ params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const { startDate, endDate } = request.qs()

    const start = startDate ? DateTime.fromISO(startDate) : undefined
    const end = endDate ? DateTime.fromISO(endDate) : undefined

    const analytics = await org.getAnalytics(start, end)

    // Get volunteer growth (monthly)
    const volunteerGrowth = await Database.from('organization_volunteers')
      .where('organization_id', org.id)
      .select(Database.raw("DATE_FORMAT(joined_at, '%Y-%m-01') as month"))
      .count('* as count')
      .groupByRaw("DATE_FORMAT(joined_at, '%Y-%m-01')")
      .orderBy('month', 'desc')
      .limit(12)

    // Get top volunteers by hours
    const topVolunteers = await Database.from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .join('users', 'users.id', 'volunteer_hours.user_id')
      .where('organization_volunteers.organization_id', org.id)
      .where('volunteer_hours.status', 'approved')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        Database.raw('SUM(volunteer_hours.hours) as total_hours')
      )
      .groupBy('users.id', 'users.first_name', 'users.last_name')
      .orderBy('total_hours', 'desc')
      .limit(10)

    return response.ok({
      ...analytics,
      volunteer_growth: volunteerGrowth,
      top_volunteers: topVolunteers
    })
  }

  /**
   * Get compliance overview for organization
   */
  public async getCompliance({ params, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    // Get compliance documents for all volunteers
    const compliance = await Database.from('compliance_documents')
      .join(
        'organization_volunteers',
        'compliance_documents.user_id',
        'organization_volunteers.user_id'
      )
      .join('users', 'users.id', 'compliance_documents.user_id')
      .where('organization_volunteers.organization_id', org.id)
      .select('compliance_documents.*', 'users.first_name', 'users.last_name', 'users.email')
      .orderBy('compliance_documents.expires_at', 'asc')

    // Categorize by status
    const now = DateTime.now()
    const categorized = {
      valid: compliance.filter(
        (doc) =>
          doc.status === 'approved' &&
          (!doc.expires_at || DateTime.fromJSDate(doc.expires_at) > now)
      ),
      expiring_soon: compliance.filter(
        (doc) =>
          doc.status === 'approved' &&
          doc.expires_at &&
          DateTime.fromJSDate(doc.expires_at).diff(now, 'days').days <= 30
      ),
      expired: compliance.filter(
        (doc) =>
          doc.status === 'approved' && doc.expires_at && DateTime.fromJSDate(doc.expires_at) < now
      ),
      pending: compliance.filter((doc) => doc.status === 'pending'),
      rejected: compliance.filter((doc) => doc.status === 'rejected')
    }

    return response.ok({
      total: compliance.length,
      valid: categorized.valid.length,
      expiring_soon: categorized.expiring_soon.length,
      expired: categorized.expired.length,
      pending: categorized.pending.length,
      rejected: categorized.rejected.length,
      documents: categorized
    })
  }

  // Dashboard Stats
  public async dashboardStats({ auth, request, response }: HttpContextContract) {
    const user = auth.user!

    const {
      organizationId,
      membership,
      multipleMemberships,
      hasMembership
    } = await this.resolveOrganizationForUser(user, request)

    if (!organizationId) {
      if (multipleMemberships) {
        return response.badRequest({
          message: 'Multiple organizations found. Provide organizationName.'
        })
      }
      if (!hasMembership && !user.isAdmin) {
        return response.notFound({ message: 'User is not part of any organization' })
      }
      return response.badRequest({ message: 'organizationName is required' })
    }

    if (!user.isAdmin && (!membership || membership.organizationId !== organizationId)) {
        if (!(await user.can('view_analytics_dashboard'))) {
            return response.forbidden({ message: 'You do not have permission to view this dashboard' })
        }
    }

    const orgId = organizationId

    const activeVolunteers = await OrganizationVolunteer.query()
      .where('organization_id', orgId)
      .where('status', 'Active')
      .count('* as total')

    // Upcoming events can exist in legacy `events` table and/or the newer `opportunities` table.
    // Count both so the organization dashboard reflects what orgs actually create.
    const now = DateTime.now().toJSDate()

    const [upcomingLegacyEvents, upcomingOpportunities] = await Promise.all([
      Event.query().where('organization_id', orgId).where('start_at', '>', now).count('* as total'),
      Opportunity.query()
        .where('organization_id', orgId)
        .where('start_at', '>', now)
        .count('* as total')
    ])

    // Total hours: prefer normalized `volunteer_hours` entries (Approved) when present,
    // otherwise fall back to legacy `organization_volunteers.hours` aggregate.
    const volunteerHoursAgg = await VolunteerHour.query()
      .where('organization_id', orgId)
      .whereIn('status', ['Approved', 'approved'])
      .count('* as count')
      .sum('hours as total')

    const hoursEntryCount = Number(volunteerHoursAgg[0].$extras.count || 0)
    const hoursFromLogs = Number(volunteerHoursAgg[0].$extras.total || 0)

    const legacyHoursAgg = await OrganizationVolunteer.query()
      .where('organization_id', orgId)
      .sum('hours as total')

    const volCount = Number(activeVolunteers[0].$extras.total || 0)
    const legacyHours = Number(legacyHoursAgg[0].$extras.total || 0)
    const hoursCount = hoursEntryCount > 0 ? hoursFromLogs : legacyHours

    // Simple impact score calculation: (Total Hours / Active Volunteers) * 10, capped at 100
    let impactScore = 0
    if (volCount > 0) {
      impactScore = Math.min(100, Math.round((hoursCount / volCount) * 10))
    }

    return response.ok({
      activeVolunteers: volCount,
      upcomingEvents:
        Number(upcomingLegacyEvents[0].$extras.total || 0) +
        Number(upcomingOpportunities[0].$extras.total || 0),
      totalHours: hoursCount,
      impactScore
    })
  }

  // Team Management
  private static readonly TEAM_ROLES = ['admin', 'coordinator', 'member']

  private normalizeTeamRole(role?: string): string {
    const normalized = (role || 'member').toString().trim().toLowerCase()
    if (!OrganizationsController.TEAM_ROLES.includes(normalized)) {
      return 'member'
    }
    return normalized
  }

  private async resolveOrganizationForUser(
    user: User,
    request?: HttpContextContract['request']
  ): Promise<{
    organizationId: number | null
    membership: OrganizationTeamMember | null
    multipleMemberships: boolean
    hasMembership: boolean
    invalidOrganizationName?: boolean
  }> {
    const rawOrgId =
      request?.input?.('organizationId') ||
      request?.qs?.().organizationId ||
      request?.params?.().organizationId ||
      request?.params?.().id

    const rawOrgName =
      request?.input?.('organizationName') ||
      request?.qs?.().organizationName ||
      request?.input?.('organization') ||
      request?.qs?.().organization ||
      request?.input?.('org') ||
      request?.qs?.().org ||
      request?.params?.().organizationName ||
      request?.params?.().organization ||
      request?.params?.().org

    const parsedOrgId = rawOrgId ? Number(rawOrgId) : undefined
    const memberships = await OrganizationTeamMember.query().where('userId', user.id)

    if (parsedOrgId && !Number.isNaN(parsedOrgId)) {
      const membership = memberships.find((m) => m.organizationId === parsedOrgId) || null
      return {
        organizationId: parsedOrgId,
        membership,
        multipleMemberships: memberships.length > 1,
        hasMembership: memberships.length > 0
      }
    }

    // If caller provided an organization name, try to resolve it (case-insensitive)
    if (rawOrgName && String(rawOrgName).trim() !== '') {
      const name = String(rawOrgName).trim()
      const org = await Organization.query()
        .whereRaw('LOWER(name) = ?', [name.toLowerCase()])
        .first()
      if (org) {
        const membership = memberships.find((m) => m.organizationId === org.id) || null
        return {
          organizationId: org.id,
          membership,
          multipleMemberships: memberships.length > 1,
          hasMembership: memberships.length > 0
        }
      }

      // Provided name didn't match any org — indicate invalid name so callers can return a clear error
      return {
        organizationId: null,
        membership: null,
        multipleMemberships: memberships.length > 1,
        hasMembership: memberships.length > 0,
        invalidOrganizationName: true
      }
    }

    if (memberships.length === 1) {
      return {
        organizationId: memberships[0].organizationId,
        membership: memberships[0],
        multipleMemberships: false,
        hasMembership: true
      }
    }

    if (memberships.length > 1) {
      // Do NOT automatically pick an organization when multiple memberships exist.
      // Require the caller to explicitly provide `organizationName` to disambiguate.
      return {
        organizationId: null,
        membership: null,
        multipleMemberships: true,
        hasMembership: true
      }
    }

    return {
      organizationId: null,
      membership: null,
      multipleMemberships: false,
      hasMembership: false
    }
  }

  public async team({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const {
      organizationId,
      membership,
      multipleMemberships,
      hasMembership,
      invalidOrganizationName
    } = await this.resolveOrganizationForUser(user, request)

    if (!organizationId) {
      if (invalidOrganizationName) {
        return response.badRequest({
          message: 'Provided organizationName not found or not associated with your account.'
        })
      }
      if (multipleMemberships) {
        return response.badRequest({
          message: 'Multiple organizations found. Provide organizationName.'
        })
      }
      if (!hasMembership && !user.isAdmin) {
        return response.notFound({ message: 'User is not part of any organization' })
      }
      return response.badRequest({ message: 'organizationName is required' })
    }

    if (!user.isAdmin && (!membership || membership.organizationId !== organizationId)) {
        const canView = (await user.can('view_users')) || (await user.can('view_teams'))
        if (!canView) {
             return response.forbidden({ message: 'You do not have permission to view this team' })
        }
    }

    const members = await OrganizationTeamMember.query()
      .where('organization_id', organizationId)
      .preload('user')
    // Flatten user fields for frontend convenience
    const payload = members.map((m) => {
      const obj: any = m.toJSON()
      obj.role = this.normalizeTeamRole(obj.role)
      if (obj.user) {
        obj.name =
          obj.user.first_name ||
          obj.user.firstName ||
          `${obj.user.first_name ?? ''} ${obj.user.last_name ?? ''}`.trim()
        obj.email = obj.user.email
      }
      return obj
    })

    return response.ok(payload)
  }

  public async inviteMember({ auth, request, response }: HttpContextContract) {
    const currentUser = auth.user!
    const {
      organizationId,
      membership,
      multipleMemberships,
      hasMembership,
      invalidOrganizationName
    } = await this.resolveOrganizationForUser(currentUser, request)

    if (!organizationId) {
      if (invalidOrganizationName) {
        return response.badRequest({
          message: 'Provided organizationName not found or not associated with your account.'
        })
      }
      if (multipleMemberships) {
        return response.badRequest({
          message: 'Multiple organizations found. Provide organizationName.'
        })
      }
      if (!hasMembership && !currentUser.isAdmin) {
        return response.notFound({ message: 'User is not part of any organization' })
      }
      return response.badRequest({ message: 'organizationName is required' })
    }

    const actorRole = currentUser.isAdmin ? 'admin' : this.normalizeTeamRole(membership?.role)
    const allowedInviteRoles = ['admin', 'coordinator']
    if (!allowedInviteRoles.includes(actorRole)) {
      return response.forbidden({ message: 'You do not have permission to invite members' })
    }
    const { email, role } = request.only(['email', 'role'])
    const normalizedRole = this.normalizeTeamRole(role)

    const targetUser = await User.findBy('email', email)
    if (!targetUser) {
      return response.badRequest({ message: 'User not found' })
    }

    // Prevent duplicate membership
    const existing = await OrganizationTeamMember.query()
      .where('organization_id', organizationId)
      .andWhere('user_id', targetUser.id)
      .first()

    if (existing) {
      return response.conflict({ message: 'User is already a member of this organization' })
    }

    const member = await OrganizationTeamMember.create({
      organizationId,
      userId: targetUser.id,
      role: normalizedRole
    })

    return response.created(member)
  }

  public async removeMember({ auth, params, request, response }: HttpContextContract) {
    // params.id is organization id, params.memberId is user id or team member id
    // Let's assume route is /organizations/:id/team/:memberId
    // where memberId is the ID of the OrganizationTeamMember record
    const user = auth.user!
    const {
      organizationId,
      membership,
      multipleMemberships,
      hasMembership,
      invalidOrganizationName
    } = await this.resolveOrganizationForUser(user, request)

    if (!organizationId) {
      if (invalidOrganizationName) {
        return response.badRequest({
          message: 'Provided organizationName not found or not associated with your account.'
        })
      }
      if (multipleMemberships) {
        return response.badRequest({
          message: 'Multiple organizations found. Provide organizationName.'
        })
      }
      if (!hasMembership && !user.isAdmin) {
        return response.notFound({ message: 'User is not part of any organization' })
      }
      return response.badRequest({ message: 'organizationName is required' })
    }

    const member = await OrganizationTeamMember.find(params.memberId)
    if (!member) return response.notFound()

    if (member.organizationId !== organizationId) {
      return response.forbidden({ message: 'Member does not belong to your organization' })
    }

    const actorRole = user.isAdmin ? 'admin' : this.normalizeTeamRole(membership?.role)
    const allowedRemoveRoles = ['admin', 'coordinator']
    const hasPermission = await user.can('manage_org_members')
    
    if (!allowedRemoveRoles.includes(actorRole) && !hasPermission) {
      return response.forbidden({ message: 'You do not have permission to remove members' })
    }

    // Prevent removing the last admin
    const adminCount = await OrganizationTeamMember.query()
      .where('organization_id', organizationId)
      .whereRaw('LOWER(role) = ?', ['admin'])
      .count('* as total')
      .first()
    const adminTotal = Number((adminCount as any)?.$extras?.total || (adminCount as any)?.total || 0)
    const isTargetAdmin = this.normalizeTeamRole(member.role) === 'admin'
    if (isTargetAdmin && adminTotal <= 1) {
      return response.conflict({ message: 'At least one admin must remain in the organization' })
    }

    await member.delete()
    return response.noContent()
  }

  // Update team member (role etc). Only allowed by org admins/coordinators
  public async updateMember({ auth, params, request, response }: HttpContextContract) {
    const currentUser = auth.user!
    const {
      organizationId,
      membership,
      multipleMemberships,
      hasMembership,
      invalidOrganizationName
    } = await this.resolveOrganizationForUser(currentUser, request)

    if (!organizationId) {
      if (invalidOrganizationName) {
        return response.badRequest({
          message: 'Provided organizationName not found or not associated with your account.'
        })
      }
      if (multipleMemberships) {
        return response.badRequest({
          message: 'Multiple organizations found. Provide organizationName.'
        })
      }
      if (!hasMembership && !currentUser.isAdmin) {
        return response.notFound({ message: 'User is not part of any organization' })
      }
      return response.badRequest({ message: 'organizationName is required' })
    }

    const actorRole = currentUser.isAdmin ? 'admin' : this.normalizeTeamRole(membership?.role)
    const allowedRoles = ['admin', 'coordinator']
    const hasPermission = await currentUser.can('manage_org_members')
    
    if (!allowedRoles.includes(actorRole) && !hasPermission) {
      return response.forbidden({ message: 'You do not have permission to update team members' })
    }

    const member = await OrganizationTeamMember.find(params.memberId)
    if (!member) return response.notFound()

    if (member.organizationId !== organizationId) {
      return response.forbidden({ message: 'Member does not belong to your organization' })
    }

    const payload = request.only(['role'])
    const normalizedRole = this.normalizeTeamRole(payload.role)

    if (this.normalizeTeamRole(member.role) === 'admin' && normalizedRole !== 'admin') {
      const adminCount = await OrganizationTeamMember.query()
        .where('organization_id', organizationId)
        .whereRaw('LOWER(role) = ?', ['admin'])
        .count('* as total')
        .first()
      const adminTotal = Number((adminCount as any)?.$extras?.total || (adminCount as any)?.total || 0)
      if (adminTotal <= 1) {
        return response.conflict({ message: 'At least one admin must remain in the organization' })
      }
    }

    member.role = normalizedRole

    await member.save()
    await member.refresh()
    await member.preload('user')

    member.role = this.normalizeTeamRole(member.role)
    return response.ok(member)
  }

  /**
   * Get organization settings (org panel)
   */
  public async getSettings({ auth, request, response }: HttpContextContract) {
    const user = auth.user!

    const {
      organizationId,
      membership,
      multipleMemberships,
      hasMembership,
      invalidOrganizationName
    } = await this.resolveOrganizationForUser(user, request)

    if (!organizationId) {
      if (invalidOrganizationName) {
        return response.badRequest({
          message: 'Provided organizationName not found or not associated with your account.'
        })
      }
      if (multipleMemberships) {
        return response.badRequest({
          message: 'Multiple organizations found. Provide organizationName.'
        })
      }
      if (!hasMembership && !user.isAdmin) {
        return response.notFound({ message: 'User is not part of any organization' })
      }
      return response.badRequest({ message: 'organizationName is required' })
    }

    if (!user.isAdmin && (!membership || membership.organizationId !== organizationId)) {
      return response.forbidden({ message: 'You do not have permission to view these settings' })
    }

    const org = await Organization.find(organizationId)
    if (!org) {
      return response.notFound()
    }

    return response.ok({
      id: org.id,
      name: org.name,
      slug: org.slug,
      timezone: org.timezone,
      status: org.status,
      settings: org.settings,
      billingMeta: org.billingMeta,
      publicProfile: org.publicProfile,
      autoApproveVolunteers: org.autoApproveVolunteers,
      isApproved: org.isApproved,
      isActive: org.isActive
    })
  }

  /**
   * Update organization settings (org panel)
   */
  public async updateSettings({ auth, request, response }: HttpContextContract) {
    const user = auth.user!

    const {
      organizationId,
      membership,
      multipleMemberships,
      hasMembership,
      invalidOrganizationName
    } = await this.resolveOrganizationForUser(user, request)

    if (!organizationId) {
      if (invalidOrganizationName) {
        return response.badRequest({
          message: 'Provided organizationName not found or not associated with your account.'
        })
      }
      if (multipleMemberships) {
        return response.badRequest({
          message: 'Multiple organizations found. Provide organizationName.'
        })
      }
      if (!hasMembership && !user.isAdmin) {
        return response.notFound({ message: 'User is not part of any organization' })
      }
      return response.badRequest({ message: 'organizationName is required' })
    }

    if (!user.isAdmin && (!membership || membership.organizationId !== organizationId)) {
      return response.forbidden({ message: 'You do not have permission to update settings' })
    }

    // Only allow admins/coordinators to update settings
    const allowedRoles = ['admin', 'coordinator']
    const actorRole = user.isAdmin ? 'admin' : this.normalizeTeamRole(membership?.role)
    const hasPermission = await user.can('manage_org_settings')
    
    if (!allowedRoles.includes(actorRole) && !hasPermission) {
      return response.forbidden({ message: 'You do not have permission to update settings' })
    }

    const org = await Organization.find(organizationId)
    if (!org) {
      return response.notFound()
    }

    const body = request.only([
      'timezone',
      'settings',
      'public_profile',
      'auto_approve_volunteers',
      'billing_meta'
    ])

    const updateData: any = {}

    if (body.timezone) updateData.timezone = body.timezone
    if (body.settings !== undefined) updateData.settings = body.settings
    if (body.public_profile !== undefined) updateData.publicProfile = body.public_profile
    if (body.auto_approve_volunteers !== undefined) {
      updateData.autoApproveVolunteers = body.auto_approve_volunteers
    }
    if (body.billing_meta !== undefined) updateData.billingMeta = body.billing_meta

    org.merge(updateData)
    await org.save()

    return response.ok({
      id: org.id,
      name: org.name,
      slug: org.slug,
      timezone: org.timezone,
      status: org.status,
      settings: org.settings,
      billingMeta: org.billingMeta,
      publicProfile: org.publicProfile,
      autoApproveVolunteers: org.autoApproveVolunteers,
      isApproved: org.isApproved,
      isActive: org.isActive
    })
  }
}
