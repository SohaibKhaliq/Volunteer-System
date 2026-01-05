import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import Database from '@ioc:Adonis/Lucid/Database'
import Role from 'App/Models/Role'
import Achievement from 'App/Models/Achievement'
import UserAchievement from 'App/Models/UserAchievement'
import VolunteerHour from 'App/Models/VolunteerHour'
import User from 'App/Models/User'
import AuthorizationService from 'App/Services/AuthorizationService'

export default class UsersController {
  /**
   * Get all users with filters, search, pagination, and sorting
   */
  public async index({ request, response }: HttpContextContract) {
    try {
      const {
        page = 1,
        perPage = 20,
        search,
        role,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = request.qs()

      const query = User.query().preload('roles').preload('complianceDocuments')

      // Search filter (use DB column names)
      if (search) {
        query.where((builder) => {
          builder
            .where('first_name', 'LIKE', `%${search}%`)
            .orWhere('last_name', 'LIKE', `%${search}%`)
            .orWhere('email', 'LIKE', `%${search}%`)
        })
      }

      // Role filter
      if (role) {
        query.whereHas('roles', (rolesQuery: any) => {
          rolesQuery.where('name', role)
        })
      }

      // Status filter (active/inactive based on email verification or custom status)
      // Status filter: consider both `is_disabled` and `email_verified_at`.
      // Active if not disabled OR has an email_verified_at timestamp.
      if (status === 'active') {
        query.where((b) => {
          b.where('is_disabled', 0).orWhereNotNull('email_verified_at')
        })
      } else if (status === 'inactive') {
        query.where((b) => {
          b.where('is_disabled', 1).orWhereNull('email_verified_at')
        })
      }

      // Sorting: map UI camelCase fields to DB column names
      const sortMap: Record<string, string> = {
        createdAt: 'created_at',
        firstName: 'first_name',
        lastName: 'last_name',
        email: 'email'
      }
      const sortField = sortMap[sortBy] ?? 'created_at'
      query.orderBy(sortField, sortOrder === 'asc' ? 'asc' : 'desc')

      // Pagination
      const users = await query.paginate(page, perPage)

      // Remove sensitive data
      // Build a compact sanitized payload that flattens Lucid model internals
      // (handles cases where models are serialized with $attributes / $preloaded)
      const pag = users.toJSON()
      const mapped = (pag.data || []).map((user: any) => {
        // Support multiple shapes: Lucid model JSON, or plain object
        const src = user.$attributes ?? user.attributes ?? user.$original ?? user
        


        const rolesFromPreload = user.$preloaded?.roles ?? user.roles ?? []
        const docs = user.$preloaded?.complianceDocuments ?? user.complianceDocuments ?? []

        // Compute compliance status
        let complianceStatus = 'pending' // default
        if (Array.isArray(docs) && docs.length > 0) {
           const hasExpired = docs.some((d: any) => 
             d.status === 'expired' || 
             (d.expiresAt && new Date(d.expiresAt) < new Date())
           )
           const hasPending = docs.some((d: any) => d.status === 'pending' || d.status === 'submitted')
           const isCompliant = docs.every((d: any) => d.status === 'approved' || d.status === 'verified')

           if (hasExpired) complianceStatus = 'expired'
           else if (hasPending) complianceStatus = 'pending'
           else if (isCompliant) complianceStatus = 'compliant'
        } else {
           // If no docs, check if any global requirements exist? 
           // For now, assume pending/unknown. 
           // If we return 'pending', the badge is yellow. If 'unknown', grey.
           // Let's stick with 'pending' as a safer default for volunteers who might need to upload things.
           complianceStatus = 'pending'
        }

        const safe: any = {
          id: src.id,
          email: src.email ?? src.email_address,
          firstName: src.firstName ?? src.first_name ?? '',
          lastName: src.lastName ?? src.last_name ?? '',
          isDisabled: src.isDisabled ?? src.is_disabled ?? 0,
          volunteerStatus: src.volunteerStatus ?? src.volunteer_status ?? undefined,
          lastLoginAt: src.lastLoginAt ?? src.last_login_at ?? src.last_active_at ?? undefined,
          profileMetadata:
            src.profileMetadata ?? src.profile_metadata ?? src.profile_metadata ?? null,
          emailVerifiedAt: src.emailVerifiedAt ?? src.email_verified_at ?? null,
          createdAt: src.createdAt ?? src.created_at ?? undefined,
          updatedAt: src.updatedAt ?? src.updated_at ?? undefined,
          // include roles as simple objects
          roles: (rolesFromPreload || []).map((r: any) => ({ id: r.id, name: r.name })),
          complianceStatus
        }

        return safe
      })

      const sanitizedUsers = { ...pag, data: mapped }
      return response.ok(sanitizedUsers)
    } catch (error) {
      Logger.error('Failed to fetch users: %o', error)
      return response.badRequest({ error: { message: 'Unable to fetch users' } })
    }
  }

  /**
   * Get analytics/statistics about users
   */
  public async analytics({ response }: HttpContextContract) {
    try {
      const totalUsers = await User.query().count('* as total')
      // use DB column name email_verified_at to avoid camelCase mapping issues
      const activeUsers = await User.query().whereNotNull('email_verified_at').count('* as total')

      // compute 30 days ago in JS (DB-agnostic)
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const recentUsers = await User.query()
        .where('created_at', '>=', since.toISOString())
        .count('* as total')

      // Users by role
      const usersByRole = await Database.from('user_roles')
        .join('roles', 'roles.id', 'user_roles.role_id')
        .select('roles.name')
        .count('* as count')
        .groupBy('roles.name')

      return response.ok({
        total: totalUsers[0].$extras.total,
        active: activeUsers[0].$extras.total,
        inactive: totalUsers[0].$extras.total - activeUsers[0].$extras.total,
        recentSignups: recentUsers[0].$extras.total,
        byRole: usersByRole
      })
    } catch (error) {
      Logger.error('Failed to fetch user analytics: %o', error)
      return response.badRequest({ error: { message: 'Unable to fetch analytics' } })
    }
  }

  /**
   * Get current authenticated user
   */
  public async me({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = await User.query()
        .where('id', auth.user!.id)
        .preload('roles')
        .preload('organizations')
        .preload('teamMemberships')
        .firstOrFail()
      const { password, ...safeUser } = user.toJSON() as any
      // compute impact score for the user (0-1000)
      try {
        // total approved hours
        const totalHoursRes = await VolunteerHour.query()
          .where('user_id', user.id)
          .andWhere('status', 'approved')
          .sum('hours as total')
        const totalHours =
          (Array.isArray(totalHoursRes)
            ? totalHoursRes[0].$extras?.total
            : (totalHoursRes as any)?.$extras?.total) || 0

        // unique events attended (from volunteer_hours or assignments)
        const eventsRes = await VolunteerHour.query()
          .where('user_id', user.id)
          .andWhere('status', 'approved')
          .select(Database.raw('COUNT(DISTINCT event_id) as cnt'))
        const eventsAttended =
          eventsRes && eventsRes[0] ? Number((eventsRes[0] as any).$extras?.cnt || 0) : 0

        // recent hours (last 90 days)
        const since = new Date()
        since.setDate(since.getDate() - 90)
        const recentRes = await VolunteerHour.query()
          .where('user_id', user.id)
          .andWhere('status', 'approved')
          .andWhere('date', '>=', since.toISOString())
          .sum('hours as total')
        const recentHours =
          (Array.isArray(recentRes)
            ? recentRes[0].$extras?.total
            : (recentRes as any)?.$extras?.total) || 0

        // last 30 days and previous 30-day window (for percent change)
        const last30Since = new Date()
        last30Since.setDate(last30Since.getDate() - 30)
        const last30Res = await VolunteerHour.query()
          .where('user_id', user.id)
          .andWhere('status', 'approved')
          .andWhere('date', '>=', last30Since.toISOString())
          .sum('hours as total')
        const last30 =
          (Array.isArray(last30Res)
            ? last30Res[0].$extras?.total
            : (last30Res as any)?.$extras?.total) || 0

        const prev30Start = new Date()
        prev30Start.setDate(prev30Start.getDate() - 60)
        const prev30End = new Date()
        prev30End.setDate(prev30End.getDate() - 30)
        const prev30Res = await VolunteerHour.query()
          .where('user_id', user.id)
          .andWhere('status', 'approved')
          .andWhere('date', '>=', prev30Start.toISOString())
          .andWhere('date', '<', prev30End.toISOString())
          .sum('hours as total')
        const prev30 =
          (Array.isArray(prev30Res)
            ? prev30Res[0].$extras?.total
            : (prev30Res as any)?.$extras?.total) || 0

        // percent change calculation (last30 vs prev30)
        let hoursChangePercent = 0
        if (prev30 === 0) {
          hoursChangePercent = last30 === 0 ? 0 : 100
        } else {
          hoursChangePercent = Math.round(
            ((Number(last30) - Number(prev30)) / Number(prev30)) * 100
          )
        }

        // New combined scoring (scale 0-1000)
        // Tunable weights / caps:
        // - hours component: scales totalHours * 6, cap 600
        // - events component: 15 points per distinct event, cap 300
        // - recent hours (90 days): scales recentHours * 2, cap 100
        const hoursScore = Math.min(600, Math.round(Number(totalHours) * 6))
        const eventsScore = Math.min(300, eventsAttended * 15)
        const recentScore = Math.min(100, Math.round(Number(recentHours) * 2))

        const impactScore = hoursScore + eventsScore + recentScore

        // Build a combined-impact score distribution across volunteers so percentile
        // is computed off the same combined metric rather than hours-only.
        const since90 = new Date()
        since90.setDate(since90.getDate() - 90)

        // Aggregations per user
        const totalsRows = await Database.from('volunteer_hours')
          .where('status', 'approved')
          .groupBy('user_id')
          .select('user_id')
          .select(Database.raw('SUM(hours) as total'))

        const eventsRows = await Database.from('volunteer_hours')
          .where('status', 'approved')
          .groupBy('user_id')
          .select('user_id')
          .select(Database.raw('COUNT(DISTINCT event_id) as events'))

        const recentRows = await Database.from('volunteer_hours')
          .where('status', 'approved')
          .where('date', '>=', since90.toISOString())
          .groupBy('user_id')
          .select('user_id')
          .select(Database.raw('SUM(hours) as recent_total'))

        const totalsMap: Record<number, number> = {}
        const eventsMap: Record<number, number> = {}
        const recentMap: Record<number, number> = {}

        totalsRows.forEach((r: any) => {
          const uid = Number(r.user_id)
          totalsMap[uid] = Number(r.total || r.$extras?.total || 0)
        })
        eventsRows.forEach((r: any) => {
          const uid = Number(r.user_id)
          eventsMap[uid] = Number(r.events || r.$extras?.events || 0)
        })
        recentRows.forEach((r: any) => {
          const uid = Number(r.user_id)
          recentMap[uid] = Number(r.recent_total || r.$extras?.recent_total || 0)
        })

        const allUserIds = Array.from(
          new Set([
            ...Object.keys(totalsMap).map(Number),
            ...Object.keys(eventsMap).map(Number),
            ...Object.keys(recentMap).map(Number)
          ])
        )

        const scoreList: number[] = allUserIds.map((uid) => {
          const uTotal = totalsMap[uid] ?? 0
          const uEvents = eventsMap[uid] ?? 0
          const uRecent = recentMap[uid] ?? 0
          const s1 = Math.min(600, Math.round(uTotal * 6))
          const s2 = Math.min(300, uEvents * 15)
          const s3 = Math.min(100, Math.round(uRecent * 2))
          return s1 + s2 + s3
        })

        const higherCount = scoreList.filter((s) => s > impactScore).length
        const totalVolunteers = scoreList.length || 1
        const pct = Math.max(
          0,
          Math.min(100, Math.round(100 - (higherCount / totalVolunteers) * 100))
        )

        ;(safeUser as any).impactScore = impactScore
        ;(safeUser as any).impactPercentile = pct

        // expose totals for frontend display
        ;(safeUser as any).hours = Number(totalHours)
        ;(safeUser as any).totalHours = Number(totalHours)
        ;(safeUser as any).recentHours = Number(recentHours)
        ;(safeUser as any).participationCount = Number(eventsAttended)
        ;(safeUser as any).hoursLast30 = Number(last30)
        ;(safeUser as any).hoursPrevious30 = Number(prev30)
        ;(safeUser as any).hoursChangePercent = Number(hoursChangePercent)

        // Achievements evaluation -- fetch enabled achievements (global + org-specific)
        try {
          const orgIds = (user.organizations || []).map((o: any) => o.id)
          const query = Achievement.query().where('is_active', true)
          // include global achievements or those for user's organizations
          query.where((b) => {
            b.whereNull('organization_id')
            if (orgIds.length > 0) b.orWhereIn('organization_id', orgIds)
          })

          const allAchievements = await query
          const earned: any[] = []

          for (const a of allAchievements) {
            // ensure criteria presence
            const criteria = a.requirement ?? null
            let match = false

            if (!criteria) {
              // no criteria -> automatically awarded
              match = true
            } else {
              // criteria can be { type: 'hours', threshold: number }
              // or { any: [ ...criteria ] } or { all: [...] }
              const evaluate = (c: any): boolean => {
                if (!c || !c.type) return false
                switch (c.type) {
                  case 'hours':
                    return Number(totalHours) >= Number(c.threshold || 0)
                  case 'events':
                    return Number(eventsAttended) >= Number(c.threshold || 0)
                  case 'recent_hours':
                    return Number(recentHours) >= Number(c.threshold || 0)
                  case 'combined_score':
                    return Number(impactScore) >= Number(c.threshold || 0)
                  case 'member_days': {
                    // user.createdAt may be a DateTime object or string from JSON
                    const createdAtVal = (user as any).createdAt ?? (safeUser as any).createdAt
                    if (!createdAtVal) return false
                    const createdDate = new Date(createdAtVal)
                    if (isNaN(createdDate.getTime())) return false
                    const days = Math.floor(
                      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
                    )
                    return days >= Number(c.threshold || 0)
                  }
                  default:
                    return false
                }
              }

              if (Array.isArray(criteria.any)) {
                match = criteria.any.some(evaluate)
              } else if (Array.isArray(criteria.all)) {
                match = criteria.all.every(evaluate)
              } else if (criteria.type) {
                match = evaluate(criteria)
              }
            }

            if (match) {
              // check if already awarded
              const existing = await UserAchievement.query()
                .where('user_id', user.id)
                .andWhere('achievement_id', a.id)
                .first()

              if (!existing) {
                // award
                await UserAchievement.create({
                  userId: user.id,
                  achievementId: a.id,
                  metadata: { awardedVia: 'auto' }
                })
                // Create a user notification so volunteers are notified when they earn an achievement
                try {
                  const Notification = await import('App/Models/Notification')
                  await Notification.default.create({
                    userId: user.id,
                    type: 'achievement_awarded',
                    payload: JSON.stringify({ achievementId: a.id, key: a.key, title: a.name }),
                    read: false
                  })
                } catch (e) {
                  Logger.warn('Failed to create notification for achievement award: %o', e)
                }
              }

              earned.push({
                id: a.id,
                key: a.key,
                title: a.name,
                description: a.description,
                points: a.points
              })
            }
          }

          ;(safeUser as any).achievements = earned
        } catch (achErr) {
          // silently fail if calculation errors occur to avoid blocking /me
          ;(safeUser as any).achievements = []
        }
      } catch (err) {
        // If any of the analytics queries fail, keep impactScore undefined and continue
        ;(safeUser as any).impactScore = undefined
        ;(safeUser as any).impactPercentile = undefined
      }

      // normalize camelCase fields
      safeUser.firstName = safeUser.firstName ?? safeUser.first_name ?? ''
      safeUser.lastName = safeUser.lastName ?? safeUser.last_name ?? ''
      safeUser.isDisabled = safeUser.isDisabled ?? safeUser.is_disabled
      safeUser.volunteerStatus = safeUser.volunteerStatus ?? safeUser.volunteer_status
      // DB schema uses `last_active_at`; map it to `lastLoginAt` for frontend
      safeUser.lastLoginAt = safeUser.lastLoginAt ?? safeUser.last_active_at
      return response.ok(safeUser)
    } catch (error) {
      // Log the error and provide a helpful server-side message. Use 500 for unexpected errors.
      Logger.error('Failed to fetch /me: %o', error)
      return response.internalServerError({
        error: { message: 'Unable to fetch current user', details: String(error?.message ?? error) }
      })
    }
  }

  /**
   * Get a single user by ID
   */
  public async show({ params, response }: HttpContextContract) {
    try {
      const user = await User.query().where('id', params.id).preload('roles').firstOrFail()

      const { password, ...safeUser } = user.toJSON() as any
      safeUser.firstName = safeUser.firstName ?? safeUser.first_name ?? ''
      safeUser.lastName = safeUser.lastName ?? safeUser.last_name ?? ''
      safeUser.isDisabled = safeUser.isDisabled ?? safeUser.is_disabled
      safeUser.volunteerStatus = safeUser.volunteerStatus ?? safeUser.volunteer_status
      // DB schema uses `last_active_at`; map it to `lastLoginAt` for frontend
      safeUser.lastLoginAt = safeUser.lastLoginAt ?? safeUser.last_active_at
      return response.ok(safeUser)
    } catch (error) {
      return response.notFound({ error: { message: 'User not found' } })
    }
  }

  /**
   * Create a new user
   */
  public async store({ request, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()

      // Accept keys that map to model properties. Use `phone` and `profileMetadata`.
      const payload = request.only([
        'email',
        'firstName',
        'lastName',
        'password',
        'isAdmin',
        'phone',
        'profileMetadata'
      ])

      // Validate required fields
      if (!payload.email || !payload.firstName) {
        return response.badRequest({
          error: { message: 'Email and first name are required' }
        })
      }

      // Ensure password exists
      if (!payload.password) {
        payload.password = 'password'
      }

      const user = await User.create(payload)

      // Attach admin role if flagged
      if (payload.isAdmin) {
        const adminRole = await Role.findBy('name', 'admin')
        if (adminRole) {
          const exists = await Database.from('user_roles')
            .where({ user_id: user.id, role_id: adminRole.id })
            .first()
          if (!exists) {
            await Database.table('user_roles').insert({ user_id: user.id, role_id: adminRole.id })
          }
        }
      }

      // return sanitized created user with relations and camelCase keys
      const createdUser = await User.query().where('id', user.id).preload('roles').firstOrFail()
      const { password, ...safeUser } = createdUser.toJSON() as any
      safeUser.firstName = safeUser.firstName ?? safeUser.first_name ?? ''
      safeUser.lastName = safeUser.lastName ?? safeUser.last_name ?? ''
      safeUser.isDisabled = safeUser.isDisabled ?? safeUser.is_disabled
      safeUser.volunteerStatus = safeUser.volunteerStatus ?? safeUser.volunteer_status
      // DB schema uses `last_active_at`; map it to `lastLoginAt` for frontend
      safeUser.lastLoginAt = safeUser.lastLoginAt ?? safeUser.last_active_at
      return response.created(safeUser)
    } catch (error) {
      Logger.error('Failed to create user: %o', error?.message || error)
      return response.badRequest({ error: { message: 'Unable to create user' } })
    }
  }

  /**
   * Update an existing user
   */
  public async update({ params, request, response }: HttpContextContract) {
    try {
      // Use a safe update that maps camelCase payload keys to DB columns
      Logger.info('Update payload', request.all())
      const payload = request.only([
        'email',
        'firstName',
        'lastName',
        'phone',
        'profileMetadata',
        'isDisabled',
        'volunteerStatus'
      ])

      // Map incoming fields to DB column names
      const updateData: Record<string, any> = {}
      if (payload.email !== undefined) updateData.email = payload.email
      if (payload.firstName !== undefined) updateData.first_name = payload.firstName
      if (payload.lastName !== undefined) updateData.last_name = payload.lastName
      if (payload.phone !== undefined) updateData.phone = payload.phone
      if (payload.profileMetadata !== undefined)
        updateData.profile_metadata = payload.profileMetadata
      if (payload.isDisabled !== undefined) updateData.is_disabled = payload.isDisabled
      if (payload.volunteerStatus !== undefined)
        updateData.volunteer_status = payload.volunteerStatus

      // perform direct update via query builder to avoid model save race conditions
      const updatedCount = await User.query()
        .where('id', params.id)
        .update({ ...updateData, updated_at: new Date() })

      if (!updatedCount) {
        Logger.warn('No rows updated for user id %s', params.id)
        return response.notFound({ error: { message: 'User not found' } })
      }

      // Return the refreshed user with roles
      const user = await User.query().where('id', params.id).preload('roles').firstOrFail()
      const { password, ...safeUser } = user.toJSON() as any
      safeUser.firstName = safeUser.firstName ?? safeUser.first_name ?? ''
      safeUser.lastName = safeUser.lastName ?? safeUser.last_name ?? ''
      safeUser.isDisabled = safeUser.isDisabled ?? safeUser.is_disabled
      safeUser.volunteerStatus = safeUser.volunteerStatus ?? safeUser.volunteer_status
      // DB schema uses `last_active_at`; map it to `lastLoginAt` for frontend
      safeUser.lastLoginAt = safeUser.lastLoginAt ?? safeUser.last_active_at
      return response.ok(safeUser)
    } catch (error) {
      Logger.error(
        'Failed to update user: %s',
        error instanceof Error ? error.message : String(error)
      )
      Logger.debug('Full error object:', error)
      return response.badRequest({ error: { message: 'Unable to update user' } })
    }
  }

  /**
   * Assign a role to a user
   */
  public async addRole({ params, request, response }: HttpContextContract) {
    try {
      const user = await User.findOrFail(params.id)
      const { roleId } = request.only(['roleId'])
      Logger.info('Assign role payload', { userId: params.id, roleId })

      const role = await Role.find(Number(roleId))
      if (!role) {
        return response.notFound({ error: { message: 'Role not found' } })
      }

      const exists = await Database.from('user_roles')
        .where({ user_id: user.id, role_id: role.id })
        .first()

      if (!exists) {
        await Database.table('user_roles').insert({ user_id: user.id, role_id: role.id })
        // Audit the change
        try {
          await AuthorizationService.logRoleChange(
            (request as any).auth?.user?.id || 0,
            user.id,
            [role.name],
            undefined,
            request.ip()
          )
        } catch (err) {
          Logger.warn('Failed to write role change audit: %o', err)
        }
      }

      return response.ok({ message: 'Role assigned' })
    } catch (err) {
      Logger.error(
        'Failed to add role to user: %s',
        err instanceof Error ? err.message : String(err)
      )
      Logger.debug('Full error object:', err)
      return response.badRequest({ error: { message: 'Unable to add role' } })
    }
  }
  public async removeRole({ params, response }: HttpContextContract) {
    try {
      // Find role name for auditing
      const role = await Role.find(params.roleId)
      await Database.from('user_roles')
        .where({ user_id: params.id, role_id: params.roleId })
        .delete()
      try {
        await AuthorizationService.logRoleChange(
          0,
          Number(params.id),
          undefined,
          role ? [role.name] : undefined
        )
      } catch (err) {
        Logger.warn('Failed to write role removal audit: %o', err)
      }
      return response.noContent()
    } catch (error) {
      Logger.error('Failed to remove role from user: %o', error)
      return response.badRequest({ error: { message: 'Unable to remove role' } })
    }
  }

  /**
   * Activate a single user (set is_disabled = 0)
   */
  public async activate({ params, response }: HttpContextContract) {
    try {
      await User.query()
        .where('id', params.id)
        .update({ is_disabled: 0, volunteer_status: 'active', email_verified_at: new Date() })
      return response.ok({ message: 'User activated' })
    } catch (error) {
      Logger.error('Failed to activate user: %o', error)
      return response.badRequest({ error: { message: 'Unable to activate user' } })
    }
  }

  /**
   * Delete a user
   */
  public async destroy({ params, response, auth, bouncer }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()

      const user = await User.find(params.id)

      if (!user) {
        return response.notFound({ error: { message: 'User not found' } })
      }

      const authenticatedUser = auth.user!

      if (await bouncer.denies('deleteUser' as never, authenticatedUser, user)) {
        return response.unauthorized({
          error: { message: 'You are not allowed to delete this user' }
        })
      }

      await user.delete()
      return response.noContent()
    } catch (error) {
      Logger.error('Failed to delete user: %o', error)
      return response.badRequest({ error: { message: 'Unable to delete the user' } })
    }
  }

  /**
   * Send reminder email to user
   */
  public async remind({ params, response }: HttpContextContract) {
    try {
      const user = await User.findOrFail(params.id)
      // Mock email sending
      Logger.info(`Sending reminder email to ${user.email}`)

      return response.ok({ message: 'Reminder sent successfully' })
    } catch (error) {
      Logger.error('Failed to send reminder: %o', error)
      return response.badRequest({ error: { message: 'Unable to send reminder' } })
    }
  }

  public async bulkUpdate({ request, response }: HttpContextContract) {
    try {
      const { ids, action } = request.only(['ids', 'action'])

      if (!Array.isArray(ids) || ids.length === 0) {
        return response.badRequest({ message: 'No IDs provided' })
      }

      const query = User.query().whereIn('id', ids)

      switch (action) {
        case 'activate':
          await query.update({
            is_disabled: 0,
            volunteer_status: 'active',
            email_verified_at: new Date()
          })
          break
        case 'deactivate':
          await query.update({ is_disabled: 1 })
          break
        case 'delete':
          await query.delete()
          break
        default:
          return response.badRequest({ message: 'Invalid action' })
      }

      return response.ok({ message: 'Bulk update successful' })
    } catch (error) {
      Logger.error('Failed to bulk update users: %o', error)
      return response.badRequest({ error: { message: 'Unable to perform bulk update' } })
    }
  }
}
