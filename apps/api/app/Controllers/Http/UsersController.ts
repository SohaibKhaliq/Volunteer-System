import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import Database from '@ioc:Adonis/Lucid/Database'
import Role from 'App/Models/Role'
import User from 'App/Models/User'
// @ts-ignore: Mail provider may not have types in this workspace
import Mail from '@ioc:Adonis/Addons/Mail'

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

      const query = User.query().preload('roles')

      // Search filter
      if (search) {
        query.where((builder) => {
          builder
            .where('firstName', 'LIKE', `%${search}%`)
            .orWhere('lastName', 'LIKE', `%${search}%`)
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

      // Sorting
      const validSortFields = ['createdAt', 'firstName', 'lastName', 'email']
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
      query.orderBy(sortField, sortOrder === 'asc' ? 'asc' : 'desc')

      // Pagination
      const users = await query.paginate(page, perPage)

      // Remove sensitive data
      const sanitizedUsers = users.toJSON()
      sanitizedUsers.data = sanitizedUsers.data.map((user: any) => {
        const { password, ...safeUser } = user
        return safeUser
      })

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
      const recentUsers = await User.query()
        .where('created_at', '>=', Database.raw("date('now', '-30 days')"))
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
      const user = await User.query().where('id', auth.user!.id).preload('roles').firstOrFail()
      const { password, ...safeUser } = user.toJSON() as any
      return response.ok(safeUser)
    } catch (error) {
      return response.badRequest({ error: { message: 'Unable to fetch current user' } })
    }
  }

  /**
   * Get a single user by ID
   */
  public async show({ params, response }: HttpContextContract) {
    try {
      const user = await User.query().where('id', params.id).preload('roles').firstOrFail()

      const { password, ...safeUser } = user.toJSON() as any
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

      return response.created(user)
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
      const user = await User.findOrFail(params.id)

      // Accept phone and profileMetadata keys
      const payload = request.only([
        'email',
        'firstName',
        'lastName',
        'phone',
        'profileMetadata',
        'isDisabled',
        'volunteerStatus'
      ])

      // Don't allow password updates through this endpoint
      user.merge(payload)
      await user.save()

      const { password, ...safeUser } = user.toJSON() as any
      return response.ok(safeUser)
    } catch (error) {
      Logger.error('Failed to update user: %o', error)
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
      const role = await Role.find(roleId)
      if (!role) {
        return response.notFound({ error: { message: 'Role not found' } })
      }

      const exists = await Database.from('user_roles')
        .where({ user_id: user.id, role_id: role.id })
        .first()
      if (!exists) {
        await Database.table('user_roles').insert({ user_id: user.id, role_id: role.id })
      }

      return response.ok({ message: 'Role assigned' })
    } catch (error) {
      Logger.error('Failed to add role to user: %o', error)
      return response.badRequest({ error: { message: 'Unable to add role' } })
    }
  }

  /**
   * Remove a role from a user
   */
  public async removeRole({ params, response }: HttpContextContract) {
    try {
      await Database.from('user_roles')
        .where({ user_id: params.id, role_id: params.roleId })
        .delete()
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
      // Try to send an email if Mail is configured; otherwise log for now
      try {
        await Mail.send((message) => {
          message
            .to(user.email)
            .subject('Reminder: Complete your volunteer profile')
            .text(`Hello ${user.firstName || ''},\n\nPlease complete your volunteer profile.`)
        })
      } catch (mailErr) {
        Logger.warn('Mail send failed (maybe not configured): %o', mailErr)
      }

      Logger.info(`Reminder triggered for user ${user.id}`)
      return response.ok({ message: 'Reminder triggered (email attempted)' })
    } catch (error) {
      Logger.error('Failed to send reminder: %o', error)
      return response.badRequest({ error: { message: 'Unable to send reminder' } })
    }
  }

  /**
   * Bulk update user statuses
   */
  public async bulkUpdate({ request, response }: HttpContextContract) {
    try {
      const { ids, action } = request.only(['ids', 'action'])

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return response.badRequest({ error: { message: 'User IDs are required' } })
      }

      const validActions = ['activate', 'deactivate', 'delete']
      if (!validActions.includes(action)) {
        return response.badRequest({ error: { message: 'Invalid action' } })
      }

      if (action === 'activate') {
        await User.query()
          .whereIn('id', ids)
          .update({ email_verified_at: new Date(), is_disabled: 0 })
      } else if (action === 'deactivate') {
        await User.query().whereIn('id', ids).update({ email_verified_at: null, is_disabled: 1 })
      } else if (action === 'delete') {
        await User.query().whereIn('id', ids).delete()
      }

      return response.ok({ message: `Successfully ${action}d ${ids.length} users` })
    } catch (error) {
      Logger.error('Failed to bulk update users: %o', error)
      return response.badRequest({ error: { message: 'Unable to update users' } })
    }
  }
}
