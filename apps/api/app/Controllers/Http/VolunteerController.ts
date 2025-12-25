import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import Application from 'App/Models/Application'
import Attendance from 'App/Models/Attendance'
import Opportunity from 'App/Models/Opportunity'
import Organization from 'App/Models/Organization'
import VolunteerHour from 'App/Models/VolunteerHour'
import UserAchievement from 'App/Models/UserAchievement'

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
          hoursResult[0]?.total ??
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
          eventsAttendedResult[0]?.count ??
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
          pendingApps[0]?.total ??
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
          acceptedApps[0]?.total ??
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
        .whereHas('applications', (q) => {
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
          title: ua.achievement?.title,
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
          hoursResult[0]?.total ??
          Object.values(hoursResult[0])[0])
        : ((hoursResult as any)?.total ?? 0)
      const totalHours = Number(rawTotal || 0)

      const eventsAttendedResult = await Attendance.query()
        .where('user_id', user.id)
        .whereNotNull('check_in_at')
        .select(Database.raw('COUNT(DISTINCT opportunity_id) as count'))
      const rawEvents = Array.isArray(eventsAttendedResult)
        ? (eventsAttendedResult[0]?.$extras?.count ??
          eventsAttendedResult[0]?.count ??
          Object.values(eventsAttendedResult[0])[0])
        : ((eventsAttendedResult as any)?.count ?? 0)
      const eventsAttended = Number(rawEvents || 0)

      const pendingApps = await Application.query()
        .where('user_id', user.id)
        .andWhere('status', 'applied')
        .count('* as total')
      const rawPending = Array.isArray(pendingApps)
        ? (pendingApps[0]?.$extras?.total ??
          pendingApps[0]?.total ??
          Object.values(pendingApps[0])[0])
        : ((pendingApps as any)?.total ?? 0)
      const pendingApplications = Number(rawPending || 0)

      const acceptedApps = await Application.query()
        .where('user_id', user.id)
        .andWhere('status', 'accepted')
        .count('* as total')
      const rawAccepted = Array.isArray(acceptedApps)
        ? (acceptedApps[0]?.$extras?.total ??
          acceptedApps[0]?.total ??
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
        .whereHas('applications', (q) => {
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
            title: ua.achievement?.title,
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
        profileMetadata: user.profileMetadata,
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
          ...payload.profileMetadata,
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
            to: payload,
          },
        }),
        ipAddress: request.ip(),
      })

      const { password, ...safeUser } = user.toJSON() as any
      return response.ok({
        ...safeUser,
        firstName: safeUser.firstName ?? safeUser.first_name,
        lastName: safeUser.lastName ?? safeUser.last_name,
      })
    } catch (error) {
      if (error.messages) {
        return response.badRequest({
          error: { message: 'Validation failed', messages: error.messages },
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
        extnames: ['jpg', 'png', 'jpeg', 'webp'],
      })

      if (!avatar) {
        return response.badRequest({ error: { message: 'No avatar file provided' } })
      }

      if (avatar.hasErrors) {
        return response.badRequest({
          error: { message: 'Invalid file', errors: avatar.errors },
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
         return response.internalServerError({ error: { message: 'Failed to upload avatar file', details: avatar.errors } })
      }

      const avatarUrl = `/uploads/${fileName}`

      const currentMeta = user.profileMetadata || {}
      user.profileMetadata = {
        ...currentMeta,
        avatar_url: avatarUrl, // Keeping snake_case if used elsewhere, or standard
      }
      
      await user.save()

      return response.ok({
        message: 'Avatar updated',
        avatarUrl,
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
        .whereHas('organization', (orgQuery) => {
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
        .whereHas('organization', (orgQuery) => {
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
      return response.notFound({ error: { message: 'Opportunity not found' } })
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
        .preload('opportunity', (q) => {
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

      const query = Attendance.query()
        .where('user_id', user.id)
        .preload('opportunity', (q) => {
          q.preload('organization')
        })
        .orderBy('check_in_at', 'desc')

      if (from) {
        query.where('check_in_at', '>=', from)
      }
      if (to) {
        query.where('check_in_at', '<=', to)
      }

      const attendances = await query.paginate(page, perPage)

      // Calculate total hours
      const all = await Attendance.query()
        .where('user_id', user.id)
        .whereNotNull('check_in_at')
        .whereNotNull('check_out_at')

      let totalMinutes = 0
      for (const a of all) {
        if (a.checkInAt && a.checkOutAt) {
          const diff = a.checkOutAt.diff(a.checkInAt, 'minutes').minutes
          totalMinutes += diff
        }
      }

      return response.ok({
        ...attendances.toJSON(),
        totalHours: Math.round((totalMinutes / 60) * 10) / 10
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
          'organizations.logo as logo_url',
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
   * Get volunteer's achievements
   */
  public async myAchievements({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const achievements = await UserAchievement.query()
        .where('user_id', user.id)
        .preload('achievement')
        .orderBy('created_at', 'desc')

      const totalPoints = achievements.reduce((sum, ua) => sum + (ua.achievement?.points || 0), 0)

      return response.ok({
        achievements: achievements.map((ua) => ({
          id: ua.achievement?.id,
          key: ua.achievement?.key,
          title: ua.achievement?.title,
          description: ua.achievement?.description,
          points: ua.achievement?.points,
          awardedAt: ua.createdAt,
          metadata: ua.metadata
        })),
        totalPoints
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
}
