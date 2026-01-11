import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import Logger from '@ioc:Adonis/Core/Logger'
import Database from '@ioc:Adonis/Lucid/Database'
import type { ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'
import Application from 'App/Models/Application'
import Attendance from 'App/Models/Attendance'
import Opportunity from 'App/Models/Opportunity'
import Organization from 'App/Models/Organization'
import VolunteerHour from 'App/Models/VolunteerHour'
import UserAchievement from 'App/Models/UserAchievement'
import Achievement from 'App/Models/Achievement'
import AchievementProgress from 'App/Models/AchievementProgress'
import ShiftAssignment from 'App/Models/ShiftAssignment'
import Team from 'App/Models/Team'

/**
 * VolunteerController - Volunteer Panel endpoints
 *
 * Features:
 * - Profile management
 * - View & search opportunities
 * - Apply for opportunities
 * - Track application status
 * - View attendance & hours
 * - Manage organization memberships
 * - View achievements and notifications
 */
export default class VolunteerController {
  /**
   * Get volunteer dashboard stats
   */
  public async dashboard({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      // Total approved hours
      const hoursResult = await VolunteerHour.query()
        .where('user_id', user.id)
        .andWhere('status', 'approved')
        .sum('hours as total')
      // Lucid may return aggregation results in different shapes depending on DB adapter.
      const rawTotal = Array.isArray(hoursResult)
        ? (hoursResult[0]?.$extras?.total ??
          (hoursResult[0] as any)?.total ??
          Object.values(hoursResult[0])[0])
        : ((hoursResult as any)?.total ?? 0)
      const totalHours = Number(rawTotal || 0)

      // Events attended (distinct events from volunteer_hours or attendances)
      const eventsAttendedResult = await Attendance.query()
        .where('user_id', user.id)
        .whereNotNull('check_in_at')
        .select(Database.raw('COUNT(DISTINCT opportunity_id) as count'))
      const rawEvents = Array.isArray(eventsAttendedResult)
        ? (eventsAttendedResult[0]?.$extras?.count ??
          (eventsAttendedResult[0] as any)?.count ??
          Object.values(eventsAttendedResult[0])[0])
        : ((eventsAttendedResult as any)?.count ?? 0)
      const eventsAttended = Number(rawEvents || 0)

      // Pending applications
      const pendingApps = await Application.query()
        .where('user_id', user.id)
        .andWhere('status', 'applied')
        .count('* as total')
      const rawPending = Array.isArray(pendingApps)
        ? (pendingApps[0]?.$extras?.total ??
          (pendingApps[0] as any)?.total ??
          Object.values(pendingApps[0])[0])
        : ((pendingApps as any)?.total ?? 0)
      const pendingApplications = Number(rawPending || 0)

      // Accepted applications
      const acceptedApps = await Application.query()
        .where('user_id', user.id)
        .andWhere('status', 'accepted')
        .count('* as total')
      const rawAccepted = Array.isArray(acceptedApps)
        ? (acceptedApps[0]?.$extras?.total ??
          (acceptedApps[0] as any)?.total ??
          Object.values(acceptedApps[0])[0])
        : ((acceptedApps as any)?.total ?? 0)
      const acceptedApplications = Number(rawAccepted || 0)

      // Organizations they belong to
      const orgsResult = await Database.from('organization_volunteers')
        .where('user_id', user.id)
        .andWhere('status', 'active')
        .count('* as total')
      const rawOrgs = Array.isArray(orgsResult)
        ? (orgsResult[0]?.total ?? Object.values(orgsResult[0])[0])
        : ((orgsResult as any)?.total ?? 0)
      const organizationCount = Number(rawOrgs || 0)

      // Upcoming events (opportunities with accepted applications in the future)
      const now = new Date()
      const upcomingOpps = await Opportunity.query()
        .whereHas('applications', (q: ModelQueryBuilderContract<typeof Application>) => {
          q.where('user_id', user.id).andWhere('status', 'accepted')
        })
        .andWhere('start_at', '>', now.toISOString())
        .andWhere('status', 'published')
        .orderBy('start_at', 'asc')
        .limit(5)

      // Recent achievements
      const achievements = await UserAchievement.query()
        .where('user_id', user.id)
        .preload('achievement')
        .orderBy('created_at', 'desc')
        .limit(5)

      return response.ok({
        stats: {
          totalHours,
          eventsAttended,
          pendingApplications,
          acceptedApplications,
          organizationCount
        },
        upcomingEvents: upcomingOpps.map((o) => ({
          id: o.id,
          title: o.title,
          slug: o.slug,
          startAt: o.startAt,
          endAt: o.endAt,
          location: o.location
        })),
        recentAchievements: achievements.map((ua) => ({
          id: ua.achievement?.id,
          title: ua.achievement?.name,
          description: ua.achievement?.description,
          awardedAt: ua.createdAt
        }))
      })
    } catch (error: any) {
      // Log stack and useful properties; stringify to avoid empty object logs
      try {
        Logger.error(
          'Volunteer dashboard error: %s',
          error?.stack ?? JSON.stringify(error, Object.getOwnPropertyNames(error))
        )
      } catch (e) {
        Logger.error('Volunteer dashboard error (unable to stringify): %o', error)
      }
      return response.internalServerError({ error: { message: 'Failed to load dashboard' } })
    }
  }

  /**
   * Get volunteer profile with skills and documents
   */
  public async profile({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = await User.query()
        .where('id', auth.user!.id)
        .preload('organizations')
        .firstOrFail()

      const { password, ...safeUser } = user.toJSON() as any

      // Get profile status per organization
      const orgStatuses = await Database.from('organization_volunteers')
        .where('user_id', user.id)
        .select('organization_id', 'status', 'role', 'joined_at')

      return response.ok({
        ...safeUser,
        firstName: safeUser.firstName ?? safeUser.first_name,
        lastName: safeUser.lastName ?? safeUser.last_name,
        organizationStatuses: orgStatuses
      })
    } catch (error) {
      Logger.error('Volunteer profile error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to load profile' } })
    }
  }

  /**
   * Combined endpoint returning both profile and dashboard data
   */
  public async dashboardProfile({ auth, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      // --- Profile portion ---
      const userRecord = await User.query()
        .where('id', user.id)
        .preload('organizations')
        .firstOrFail()

      const { password, ...safeUser } = userRecord.toJSON() as any

      const orgStatuses = await Database.from('organization_volunteers')
        .where('user_id', user.id)
        .select('organization_id', 'status', 'role', 'joined_at')

      // --- Dashboard portion ---
      const hoursResult = await VolunteerHour.query()
        .where('user_id', user.id)
        .andWhere('status', 'approved')
        .sum('hours as total')
      const rawTotal = Array.isArray(hoursResult)
        ? (hoursResult[0]?.$extras?.total ??
          (hoursResult[0] as any)?.total ??
          Object.values(hoursResult[0])[0])
        : ((hoursResult as any)?.total ?? 0)
      const totalHours = Number(rawTotal || 0)

      const eventsAttendedResult = await Attendance.query()
        .where('user_id', user.id)
        .whereNotNull('check_in_at')
        .select(Database.raw('COUNT(DISTINCT opportunity_id) as count'))
      const rawEvents = Array.isArray(eventsAttendedResult)
        ? (eventsAttendedResult[0]?.$extras?.count ??
          (eventsAttendedResult[0] as any)?.count ??
          Object.values(eventsAttendedResult[0])[0])
        : ((eventsAttendedResult as any)?.count ?? 0)
      const eventsAttended = Number(rawEvents || 0)

      const pendingApps = await Application.query()
        .where('user_id', user.id)
        .andWhere('status', 'applied')
        .count('* as total')
      const rawPending = Array.isArray(pendingApps)
        ? (pendingApps[0]?.$extras?.total ??
          (pendingApps[0] as any)?.total ??
          Object.values(pendingApps[0])[0])
        : ((pendingApps as any)?.total ?? 0)
      const pendingApplications = Number(rawPending || 0)

      const acceptedApps = await Application.query()
        .where('user_id', user.id)
        .andWhere('status', 'accepted')
        .count('* as total')
      const rawAccepted = Array.isArray(acceptedApps)
        ? (acceptedApps[0]?.$extras?.total ??
          (acceptedApps[0] as any)?.total ??
          Object.values(acceptedApps[0])[0])
        : ((acceptedApps as any)?.total ?? 0)
      const acceptedApplications = Number(rawAccepted || 0)

      const orgsResult = await Database.from('organization_volunteers')
        .where('user_id', user.id)
        .andWhere('status', 'active')
        .count('* as total')
      const rawOrgs = Array.isArray(orgsResult)
        ? (orgsResult[0]?.total ?? Object.values(orgsResult[0])[0])
        : ((orgsResult as any)?.total ?? 0)
      const organizationCount = Number(rawOrgs || 0)

      const now = new Date()
      const upcomingOpps = await Opportunity.query()
        .whereHas('applications', (q: ModelQueryBuilderContract<typeof Application>) => {
          q.where('user_id', user.id).andWhere('status', 'accepted')
        })
        .andWhere('start_at', '>', now.toISOString())
        .andWhere('status', 'published')
        .orderBy('start_at', 'asc')
        .limit(5)

      const achievements = await UserAchievement.query()
        .where('user_id', user.id)
        .preload('achievement')
        .orderBy('created_at', 'desc')
        .limit(5)

      return response.ok({
        profile: {
          ...safeUser,
          firstName: safeUser.firstName ?? safeUser.first_name,
          lastName: safeUser.lastName ?? safeUser.last_name,
          organizationStatuses: orgStatuses
        },
        dashboard: {
          stats: {
            totalHours,
            eventsAttended,
            pendingApplications,
            acceptedApplications,
            organizationCount
          },
          upcomingEvents: upcomingOpps.map((o) => ({
            id: o.id,
            title: o.title,
            slug: o.slug,
            startAt: o.startAt,
            endAt: o.endAt,
            location: o.location
          })),
          recentAchievements: achievements.map((ua) => ({
            id: ua.achievement?.id,
            title: ua.achievement?.name,
            description: ua.achievement?.description,
            awardedAt: ua.createdAt
          }))
        }
      })
    } catch (error) {
      Logger.error('DashboardProfile error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to load profile + dashboard' }
      })
    }
  }

  /**
   * Update volunteer profile
   */
  /**
   * Update volunteer profile
   */
  public async updateProfile({ auth, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = await User.findOrFail(auth.user!.id)

      // Use Validator
      // Dynamic import to avoid circular dependency issues if any, mainly strict typing
      const { default: UpdateProfileValidator } = await import(
        'App/Validators/UpdateProfileValidator'
      )
      const payload = await request.validate(UpdateProfileValidator)

      const oldData = {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileMetadata: user.profileMetadata
      }

      // Map to DB columns
      if (payload.firstName !== undefined) user.firstName = payload.firstName
      if (payload.lastName !== undefined) user.lastName = payload.lastName
      if (payload.phone !== undefined) user.phone = payload.phone

      if (payload.profileMetadata) {
        // Merge with existing metadata to avoid losing other fields like `avatar_url` or `bookmarkedOpportunities`
        const currentMeta = user.profileMetadata || {}
        user.profileMetadata = {
          ...currentMeta,
          ...payload.profileMetadata
        }
      }

      await user.save()

      // Log to AuditLog
      // Dynamic import for AuditLog to ensure it's available
      const { default: AuditLog } = await import('App/Models/AuditLog')
      await AuditLog.safeCreate({
        userId: user.id,
        action: 'volunteer.profile_update',
        targetType: 'user',
        targetId: user.id,
        details: 'Volunteer updated their profile',
        metadata: JSON.stringify({
          changes: {
            from: oldData,
            to: payload
          }
        }),
        ipAddress: request.ip()
      })

      const { password, ...safeUser } = user.toJSON() as any
      return response.ok({
        ...safeUser,
        firstName: safeUser.firstName ?? safeUser.first_name,
        lastName: safeUser.lastName ?? safeUser.last_name
      })
    } catch (error) {
      if (error.messages) {
        return response.badRequest({
          error: { message: 'Validation failed', messages: error.messages }
        })
      }
      Logger.error('Volunteer update profile error: %o', error)
      return response.badRequest({ error: { message: 'Failed to update profile' } })
    }
  }

  /**
   * Update volunteer avatar
   */
  public async updateAvatar({ auth, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = await User.findOrFail(auth.user!.id)

      const avatar = request.file('avatar', {
        size: '5mb',
        extnames: ['jpg', 'png', 'jpeg', 'webp']
      })

      if (!avatar) {
        return response.badRequest({ error: { message: 'No avatar file provided' } })
      }

      if (avatar.hasErrors) {
        return response.badRequest({
          error: { message: 'Invalid file', errors: avatar.errors }
        })
      }

      // In a real app we'd upload to S3/GCS. For this local project, we might just return a mock URL
      // OR actually move it to a public folder if configured.
      // Assuming straightforward local handling or a mock for now:
      // "uploads" isn't fully set up in the file list I saw, so let's stick to a reliable pattern.
      // We will assume `Drive` is configured or just use a placeholder if we can't save.
      // Actually, Adonis `Drive` is standard. Let's try to verify if Drive is used.
      // For now, let's just use `valid` check and assume we save it.

      // We'll simulate a save or use a public path if available.
      // Since I can't easily check `config/drive.ts` right now without another step,
      // I'll assume standard `moveToDisk` matches existing logic if any.
      // BUT, to be safe and avoid errors, I'll use a simple mock implementation that updates the URL
      // assuming the file *would* be handled by a Drive provider.

      // WAIT, `Application.tmpPath` or `publicPath`?
      // Let's just update the metadata with a fake URL for now to satisfy the requirement "allow viewing/updating"
      // effectively assuming the upload middleware would handle it, OR just basic file placement.

      // Let's try to actually save it to `public/uploads` if possible.
      // `avatar.moveToDisk('./')` ?

      // Simplest robust approach:
      // 1. Generate name
      const fileName = `${user.id}_${new Date().getTime()}.${avatar.extname}`
      // 2. Move (this works if Drive is set up, otherwise we might fail).
      // Let's use `avatar.moveToDisk` if we trust the setup, or `moveTo` to local.
      // I'll use `Application.publicPath('uploads')` if I can import Application.

      // Dynamic import
      const { default: Application } = await import('@ioc:Adonis/Core/Application')

      await avatar.move(Application.publicPath('uploads'), {
        name: fileName,
        overwrite: true
      })

      if (avatar.state !== 'moved') {
        return response.internalServerError({
          error: { message: 'Failed to upload avatar file', details: avatar.errors }
        })
      }

      const avatarUrl = `/uploads/${fileName}`

      const currentMeta = user.profileMetadata || {}
      user.profileMetadata = {
        ...currentMeta,
        avatar_url: avatarUrl // Keeping snake_case if used elsewhere, or standard
      }

      await user.save()

      return response.ok({
        message: 'Avatar updated',
        avatarUrl
      })
    } catch (error) {
      Logger.error('Update avatar error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to update avatar' } })
    }
  }

  /**
   * Search and browse public opportunities
   */
  public async browseOpportunities({ auth, request, response }: HttpContextContract) {
    try {
      // Auth is optional for public browsing
      try {
        await auth.use('api').authenticate()
      } catch {
        // Continue without auth
      }

      const {
        page = 1,
        perPage = 20,
        search,
        city,
        skills,
        dateFrom,
        dateTo,
        organizationId,
        sortBy = 'start_at',
        sortOrder = 'asc'
      } = request.qs()

      const query = Opportunity.query()
        .where('status', 'published')
        .andWhere('visibility', 'public')
        .whereHas('organization', (orgQuery: ModelQueryBuilderContract<typeof Organization>) => {
          orgQuery.where('status', 'active')
        })
        .preload('organization')

      // Search filter
      if (search) {
        query.where((builder) => {
          builder
            .where('title', 'LIKE', `%${search}%`)
            .orWhere('description', 'LIKE', `%${search}%`)
            .orWhere('location', 'LIKE', `%${search}%`)
        })
      }

      // City filter (in location field)
      if (city) {
        query.where('location', 'LIKE', `%${city}%`)
      }

      // Organization filter
      if (organizationId) {
        query.where('organization_id', organizationId)
      }

      // Date range filter
      if (dateFrom) {
        query.where('start_at', '>=', dateFrom)
      }
      if (dateTo) {
        query.where('start_at', '<=', dateTo)
      }

      // Sorting
      const sortMap: Record<string, string> = {
        startAt: 'start_at',
        start_at: 'start_at',
        title: 'title',
        createdAt: 'created_at'
      }
      const sortField = sortMap[sortBy] ?? 'start_at'
      query.orderBy(sortField, sortOrder === 'desc' ? 'desc' : 'asc')

      const opportunities = await query.paginate(page, perPage)

      return response.ok(opportunities)
    } catch (error) {
      Logger.error('Browse opportunities error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to browse opportunities' } })
    }
  }

  /**
   * Get opportunity detail
   */
  public async opportunityDetail({ auth, params, response }: HttpContextContract) {
    try {
      // Auth is optional
      let userId: number | null = null
      try {
        await auth.use('api').authenticate()
        userId = auth.user!.id
      } catch {
        // Continue without auth
      }

      const opportunity = await Opportunity.query()
        .where('id', params.id)
        .whereHas('organization', (orgQuery: ModelQueryBuilderContract<typeof Organization>) => {
          orgQuery.where('status', 'active')
        })
        .preload('organization')
        .preload('team')
        .firstOrFail()

      // Check if user has applied
      let applicationStatus: string | null = null
      let attendanceStatus: string | null = null

      if (userId) {
        const application = await Application.query()
          .where('opportunity_id', opportunity.id)
          .andWhere('user_id', userId)
          .first()

        if (application) {
          applicationStatus = application.status
        }

        // Check attendance
        const attendance = await Attendance.query()
          .where('opportunity_id', opportunity.id)
          .andWhere('user_id', userId)
          .first()

        if (attendance) {
          attendanceStatus = attendance.checkInAt
            ? attendance.checkOutAt
              ? 'completed'
              : 'checked_in'
            : null
        }
      }

      return response.ok({
        ...opportunity.toJSON(),
        userApplicationStatus: applicationStatus,
        userAttendanceStatus: attendanceStatus
      })
    } catch (error) {
      Logger.error('Opportunity detail error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to load opportunity' } })
    }
  }

  /**
   * Apply for an opportunity
   */
  public async apply({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const opportunityId = params.id
      const { notes } = request.only(['notes'])

      const opportunity = await Opportunity.find(opportunityId)
      if (!opportunity) {
        return response.notFound({ message: 'Opportunity not found' })
      }

      if (opportunity.status !== 'published') {
        return response.badRequest({ message: 'Opportunity is not open for applications' })
      }

      // Check if already applied
      const existingApplication = await Application.query()
        .where('opportunity_id', opportunityId)
        .where('user_id', user.id)
        .first()

      if (existingApplication) {
        return response.badRequest({ message: 'You have already applied for this opportunity' })
      }

      // Check capacity
      // We count 'accepted' applications against capacity.

      // --- Compliance Check ---
      const ComplianceRequirement = (await import('App/Models/ComplianceRequirement')).default
      const ComplianceDocument = (await import('App/Models/ComplianceDocument')).default

      const requirements = await ComplianceRequirement.query()
        .where('organization_id', opportunity.organizationId)
        .andWhere((q) => {
          q.whereNull('opportunity_id').orWhere('opportunity_id', opportunity.id)
        })
        .andWhere('is_mandatory', true)
        .andWhereIn('enforcement_level', ['onboarding', 'signup'])

      if (requirements.length > 0) {
        // Fetch user's valid documents
        // We need to check doc_type against requirements
        const docTypes = requirements.map((r) => r.docType)
        const userDocs = await ComplianceDocument.query()
          .where('user_id', user.id)
          .whereIn('doc_type', docTypes)
          .where('status', 'Valid')
          .where((q) => {
            q.whereNull('expires_at').orWhere('expires_at', '>', DateTime.now().toSQL())
          })

        const validDocTypes = new Set(userDocs.map((d) => d.docType))
        const missingRequirements = requirements.filter((r) => !validDocTypes.has(r.docType))

        if (missingRequirements.length > 0) {
          return response.forbidden({
            message: 'You do not meet the compliance requirements for this opportunity.',
            requirements: missingRequirements.map((r) => ({ name: r.name, docType: r.docType }))
          })
        }
      }
      // --- End Compliance Check ---

      const acceptedCountRaw = await Application.query()

        .where('opportunity_id', opportunityId)
        .where('status', 'accepted')
        .count('* as total')

      const acceptedCount = acceptedCountRaw[0].$extras.total

      let status = 'applied'
      let message = 'Application submitted successfully'

      if (opportunity.capacity > 0 && acceptedCount >= opportunity.capacity) {
        status = 'waitlisted'
        message = 'Opportunity is full. You have been added to the waitlist.'
      } else {
        // Auto-approve logic could go here if the org has it enabled.
        // For now, default to 'applied' (pending approval).
      }

      const application = await Application.create({
        opportunityId: opportunity.id,
        userId: user.id,
        status,
        appliedAt: DateTime.now(),
        notes
      })

      // Send notification to Org Admins? (TODO)

      return response.created({
        message,
        application
      })
    } catch (error) {
      Logger.error('Apply opportunity error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to apply for opportunity' } })
    }
  }

  /**
   * Withdraw application
   */
  public async withdraw({ auth, params, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const opportunityId = params.id // Assuming route is POST /opportunities/:id/withdraw or DELETE /applications/:id
      // Route in plan was not specific, but let's assume /opportunities/:id/withdraw for user convenience

      // If the route is DELETE /applications/:id, params.id is applicationId.
      // Let's check routes.ts... typically we might do DELETE /opportunities/:id/application
      // Checking routes.ts... it wasn't there yet.
      // Let's implement it as: POST /opportunities/:id/withdraw in routes, handled here.

      const application = await Application.query()
        .where('opportunity_id', opportunityId)
        .where('user_id', user.id)
        .whereIn('status', ['applied', 'accepted', 'waitlisted'])
        .first()

      if (!application) {
        return response.badRequest({ message: 'No active application found for this opportunity' })
      }

      application.status = 'withdrawn'
      // application.respondedAt ? No
      await application.save()

      // If they were accepted, we might want to auto-promote someone from waitlist (Future enhancement)

      return response.ok({ message: 'Application withdrawn' })
    } catch (error) {
      Logger.error('Withdraw application error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to withdraw application' } })
    }
  }

  /**
   * Get volunteer's applications
   */
  public async myApplications({ auth, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const { page = 1, perPage = 20, status } = request.qs()

      const query = Application.query()
        .where('user_id', user.id)
        .preload('opportunity', (q: ModelQueryBuilderContract<typeof Opportunity>) => {
          q.preload('organization')
        })
        .orderBy('applied_at', 'desc')

      if (status) {
        query.where('status', status)
      }

      const applications = await query.paginate(page, perPage)

      return response.ok(applications)
    } catch (error) {
      Logger.error('My applications error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to load applications' } })
    }
  }

  /**
   * Get volunteer's attendance history
   */
  public async myAttendance({ auth, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const { page = 1, perPage = 20, from, to } = request.qs()

      const query = ShiftAssignment.query()
        .where('user_id', user.id)
        .preload('shift', (q) => {
          q.preload('event', (eq) => {
            eq.preload('organization')
          })
        })
        .orderBy('created_at', 'desc')

      // Use created_at or shift date for filtering if needed, 
      // but usually ShiftAssignment is the entity.
      
      const assignments = await query.paginate(page, perPage)

      // Calculate total hours from approved hours or from assignments
      const hoursResult = await ShiftAssignment.query()
        .where('user_id', user.id)
        .whereNotNull('hours')
        .sum('hours as total')
      
      const totalHours = Number(hoursResult[0]?.$extras?.total || 0)

      return response.ok({
        ...assignments.toJSON(),
        totalHours: Math.round(totalHours * 10) / 10
      })
    } catch (error) {
      Logger.error('My attendance error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to load attendance' } })
    }
  }

  /**
   * Get volunteer's hours summary
   */
  public async myHours({ auth, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const { from, to, status = 'approved' } = request.qs()

      const query = VolunteerHour.query()
        .where('user_id', user.id)
        .preload('event')
        .orderBy('date', 'desc')

      if (status) {
        query.where('status', status)
      }

      if (from) {
        query.where('date', '>=', from)
      }
      if (to) {
        query.where('date', '<=', to)
      }

      const hours = await query.exec()

      // Summary
      const totalApproved = hours
        .filter((h) => h.status === 'approved')
        .reduce((sum, h) => sum + Number(h.hours || 0), 0)

      const totalPending = await VolunteerHour.query()
        .where('user_id', user.id)
        .andWhere('status', 'pending')
        .sum('hours as total')

      // Monthly breakdown
      const monthlyData: Record<string, number> = {}
      hours.forEach((h) => {
        const month = h.date.toFormat('yyyy-MM')
        monthlyData[month] = (monthlyData[month] || 0) + Number(h.hours || 0)
      })

      return response.ok({
        hours: hours.map((h) => h.toJSON()),
        summary: {
          totalApproved,
          totalPending: Number(totalPending[0]?.$extras?.total || 0),
          monthlyBreakdown: Object.entries(monthlyData).map(([month, total]) => ({
            month,
            hours: total
          }))
        }
      })
    } catch (error) {
      Logger.error('My hours error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to load hours' } })
    }
  }

  /**
   * Get organizations the volunteer belongs to
   */
  public async myOrganizations({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const memberships = await Database.from('organization_volunteers')
        .join('organizations', 'organizations.id', 'organization_volunteers.organization_id')
        .where('organization_volunteers.user_id', user.id)
        .select(
          'organizations.id',
          'organizations.name',
          'organizations.slug',
          'organizations.logo_url',
          'organizations.status as org_status',
          'organization_volunteers.role',
          'organization_volunteers.status',
          'organization_volunteers.joined_at'
        )

      return response.ok(memberships)
    } catch (error) {
      Logger.error('My organizations error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to load organizations' } })
    }
  }

  /**
   * Join an organization (request membership)
   */
  public async joinOrganization({ auth, params, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const org = await Organization.find(params.id)
      if (!org) {
        return response.notFound({ error: { message: 'Organization not found' } })
      }

      // Check if already a member
      const existing = await Database.from('organization_volunteers')
        .where('organization_id', org.id)
        .andWhere('user_id', user.id)
        .first()

      if (existing) {
        return response.conflict({ error: { message: 'Already a member of this organization' } })
      }

      // Add as pending volunteer
      await Database.table('organization_volunteers').insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'volunteer',
        status: 'pending',
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })

      return response.created({ message: 'Membership request submitted' })
    } catch (error) {
      Logger.error('Join organization error: %o', error)
      // If auth failed, return 401
      if ((error as any)?.name === 'InvalidJwtToken' || (error as any)?.code === 'E_INVALID_JWT') {
        return response.unauthorized({ error: { message: 'Unauthenticated' } })
      }
      return response.internalServerError({ error: { message: 'Failed to join organization' } })
    }
  }

  /**
   * Leave an organization
   */
  public async leaveOrganization({ auth, params, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const deleted = await Database.from('organization_volunteers')
        .where('organization_id', params.id)
        .andWhere('user_id', user.id)
        .delete()

      if (!deleted) {
        return response.notFound({ error: { message: 'Membership not found' } })
      }

      return response.ok({ message: 'Left organization' })
    } catch (error) {
      Logger.error('Leave organization error: %o', error)
      if ((error as any)?.name === 'InvalidJwtToken' || (error as any)?.code === 'E_INVALID_JWT') {
        return response.unauthorized({ error: { message: 'Unauthenticated' } })
      }
      return response.internalServerError({ error: { message: 'Failed to leave organization' } })
    }
  }

  /**
   * Get volunteer's achievements with progress tracking
   */
  public async myAchievements({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      // Get earned achievements
      const earnedAchievements = await UserAchievement.query()
        .where('user_id', user.id)
        .preload('achievement', (query) => {
          // query.preload('category') // Category is now a string
        })
        .preload('granter')
        .orderBy('unlocked_at', 'desc')

      // Get all enabled achievements
      const allAchievements = await Achievement.query()
        //.preload('category') // Category is now a string column on Achievement
        //.orderBy('points', 'asc') // Already ordered by points
        .orderBy('points', 'asc')

      // Get progress for milestone achievements
      const progressData = await AchievementProgress.query()
        .where('user_id', user.id)
        .preload('achievement')

      const progressMap = new Map(progressData.map((p) => [p.achievementId, p]))
      const earnedIds = new Set(earnedAchievements.map((ua) => ua.achievementId))

      // Calculate total points
      const totalPoints = earnedAchievements.reduce(
        (sum, ua) => sum + (ua.achievement?.points || 0),
        0
      )

      // Build response with earned and locked achievements
      const earned = earnedAchievements.map((ua) => ({
        id: ua.achievement?.id,
        key: ua.achievement?.key,
        title: ua.achievement?.name,
        description: ua.achievement?.description,
        icon: ua.achievement?.icon,
        badgeImageUrl: ua.achievement?.badgeImageUrl,
        points: ua.achievement?.points,
        category: ua.achievement?.category
          ? {
              id: 0, // computed or dummy
              name: ua.achievement.category,
              icon: 'star'
            }
          : null,
        awardedAt: ua.unlockedAt,
        metadata: ua.metadata,
        grantedBy: ua.grantedBy,
        granter: ua.granter
          ? {
              id: ua.granter.id,
              firstName: ua.granter.firstName,
              lastName: ua.granter.lastName
            }
          : null,
        grantReason: ua.grantReason
      }))

      const locked = allAchievements
        .filter((ach) => !earnedIds.has(ach.id))
        .map((ach) => {
          const progress = progressMap.get(ach.id)
          return {
            id: ach.id,
            key: ach.key,
            title: ach.name,
            description: ach.description,
            icon: ach.icon,
            badgeImageUrl: ach.badgeImageUrl,
            points: ach.points,
            category: ach.category
              ? {
                  id: 0,
                  name: ach.category,
                  icon: 'star'
                }
              : null,
            isMilestone: ach.isMilestone,
            progress: progress
              ? {
                  currentValue: progress.currentValue,
                  targetValue: progress.targetValue,
                  percentage: progress.percentage
                }
              : null
          }
        })

      // Find next achievable (closest to completion)
      const nextToUnlock = locked
        .filter((ach) => ach.progress && ach.progress.percentage > 0)
        .sort((a, b) => (b.progress?.percentage || 0) - (a.progress?.percentage || 0))
        .slice(0, 3)

      // Group by category
      const categories = new Map<string, any>()
      ;[...earned, ...locked].forEach((ach) => {
        if (ach.category) {
          if (!categories.has(ach.category.name)) {
            categories.set(ach.category.name, {
              ...ach.category,
              achievements: []
            })
          }
          categories.get(ach.category.name)!.achievements.push(ach)
        }
      })

      return response.ok({
        earned,
        locked,
        nextToUnlock,
        categories: Array.from(categories.values()),
        stats: {
          totalPoints,
          earnedCount: earned.length,
          lockedCount: locked.length,
          totalCount: allAchievements.length,
          completionPercentage: Math.round((earned.length / allAchievements.length) * 100)
        }
      })
    } catch (error) {
      Logger.error('My achievements error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to load achievements' } })
    }
  }

  /**
   * Bookmark/save an opportunity
   */
  public async bookmarkOpportunity({ auth, params, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      // Store bookmark in user's profile metadata
      const userRecord = await User.findOrFail(user.id)
      const metadata = userRecord.profileMetadata || {}

      const bookmarks = (metadata as any).bookmarkedOpportunities || []
      if (!bookmarks.includes(params.id)) {
        bookmarks.push(parseInt(params.id, 10))
        ;(metadata as any).bookmarkedOpportunities = bookmarks
        userRecord.profileMetadata = metadata
        await userRecord.save()
      }

      return response.ok({ message: 'Opportunity bookmarked' })
    } catch (error) {
      Logger.error('Bookmark opportunity error: %o', error)
      return response.badRequest({ error: { message: 'Failed to bookmark opportunity' } })
    }
  }

  /**
   * Remove bookmark from opportunity
   */
  public async unbookmarkOpportunity({ auth, params, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const userRecord = await User.findOrFail(user.id)
      const metadata = userRecord.profileMetadata || {}

      const bookmarks = (metadata as any).bookmarkedOpportunities || []
      const oppId = parseInt(params.id, 10)
      const index = bookmarks.indexOf(oppId)
      if (index > -1) {
        bookmarks.splice(index, 1)
        ;(metadata as any).bookmarkedOpportunities = bookmarks
        userRecord.profileMetadata = metadata
        await userRecord.save()
      }

      return response.ok({ message: 'Bookmark removed' })
    } catch (error) {
      Logger.error('Unbookmark opportunity error: %o', error)
      return response.badRequest({ error: { message: 'Failed to remove bookmark' } })
    }
  }

  /**
   * Get bookmarked opportunities
   */
  public async bookmarkedOpportunities({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const userRecord = await User.findOrFail(user.id)
      const metadata = userRecord.profileMetadata || {}

      const bookmarks = (metadata as any).bookmarkedOpportunities || []

      if (bookmarks.length === 0) {
        return response.ok({ opportunities: [] })
      }

      const opportunities = await Opportunity.query()
        .whereIn('id', bookmarks)
        .preload('organization')
        .orderBy('start_at', 'asc')

      return response.ok({
        opportunities: opportunities.map((o) => o.toJSON())
      })
    } catch (error) {
      Logger.error('Bookmarked opportunities error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to load bookmarks' } })
    }
  }
  /**
   * Browse available organizations to join
   */
  public async browseOrganizations({ request, response }: HttpContextContract) {
    try {
      const { page = 1, perPage = 20, search, city, type } = request.qs()

      const query = Organization.query()
        .where('is_active', true)
        .where('is_approved', true)
        .where('public_profile', true)

      if (search) {
        query.where('name', 'ilike', `%${search}%`)
      }

      if (city) {
        query.where('address', 'ilike', `%${city}%`)
      }

      if (type) {
        query.where('type', type)
      }

      const organizations = await query.paginate(page, perPage)

      // We might want to attach "isMember" status if we had the user context handy and efficiently,
      // but for "browse" usually we just list them. The frontend can cross-check with "myOrganizations".

      return response.ok(organizations)
    } catch (error) {
      Logger.error('Browse organizations error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to load organizations' } })
    }
  }

  /**
   * Get teams the volunteer belongs to
   */
  public async myTeams({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const assignments = await Database.from('organization_team_members')
        .join('teams', 'teams.id', 'organization_team_members.team_id')
        .join('organizations', 'organizations.id', 'teams.organization_id')
        .where('organization_team_members.user_id', user.id)
        .andWhere('organization_team_members.is_active', true)
        .select(
          'teams.id',
          'teams.name',
          'teams.description',
          'teams.lead_user_id',
          'organizations.name as organization_name',
          'organizations.slug as organization_slug',
          'organizations.logo_url as organization_logo',
          'organization_team_members.role',
          'organization_team_members.joined_at'
        )

      // Fetch team members count for each team
      const teamDetails = await Promise.all(
        assignments.map(async (team) => {
          const membersCountResult = await Database.from('organization_team_members')
            .where('team_id', team.id)
            .andWhere('is_active', true)
            .count('* as total')
          const membersCount = Number(membersCountResult[0].total)

          let lead = null
          if (team.lead_user_id) {
            const leadUser = await User.find(team.lead_user_id)
            if (leadUser) {
              lead = {
                id: leadUser.id,
                firstName: leadUser.firstName,
                lastName: leadUser.lastName,
                email: leadUser.email,
                avatarUrl: leadUser.profileImageUrl
              }
            }
          }

          return {
            ...team,
            membersCount,
            lead
          }
        })
      )

      return response.ok(teamDetails)
    } catch (error) {
      Logger.error('My teams error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to load teams' } })
    }
  }
}
