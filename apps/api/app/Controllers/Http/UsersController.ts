import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'

import Database from '@ioc:Adonis/Lucid/Database'
import Role from 'App/Models/Role'
import User from 'App/Models/User'

export default class UsersController {
  public async me({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()

      const user = await User.query().where('id', auth.user!.id).preload('roles').firstOrFail()

      // hide sensitive fields
      const { password, ...safeUser } = user.toJSON() as any

      return response.ok(safeUser)
    } catch (error) {
      return response.badRequest({ error: { message: 'Unable to fetch current user' } })
    }
  }
  public async destroy({ params, response, auth, bouncer }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()

      const user = await User.find(params.id)

      if (!user) {
        return response.notFound({
          error: { message: 'User not found' }
        })
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
      console.log(error)
      Logger.error('Failed to delete user: ', { error: error.message })
      return response.badRequest({
        error: { message: 'Unable delete the user' }
      })
    }
  }

  public async store({ request, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()

      const payload = request.only([
        'email',
        'firstName',
        'lastName',
        'password',
        'isAdmin'
      ])
      // ensure a password exists for the user (default to "password" for dev seeding)
      if (!payload.password) {
        payload.password = 'password'
      }

      const user = await User.create(payload)

      // if flagged isAdmin, attach admin role if it exists
      if (payload.isAdmin) {
        const adminRole = await Role.findBy('name', 'admin')
        if (adminRole) {
          await Database.table('user_roles').insert({ user_id: user.id, role_id: adminRole.id })
        }
      }

      return response.created(user)
    } catch (error) {
      Logger.error('Failed to create user: %o', error?.message || error)
      return response.badRequest({ error: { message: 'Unable to create user' } })
    }
  }
}
