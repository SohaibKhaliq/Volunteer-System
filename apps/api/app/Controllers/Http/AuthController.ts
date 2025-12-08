import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import Role from 'App/Models/Role'
import Organization from 'App/Models/Organization'

import User from '../../Models/User'

export default class AuthController {
  public async register({ request, response, auth }: HttpContextContract) {
    try {
      const userSchema = schema.create({
        email: schema.string({ trim: true }, [
          rules.email(),
          rules.unique({ table: 'users', column: 'email', caseInsensitive: true })
        ]),
        password: schema.string({}, [rules.minLength(8)]),
        firstName: schema.string.optional({ trim: true }),
        lastName: schema.string.optional({ trim: true }),
        role: schema.enum(['volunteer', 'organization'] as const),
        organizationName: schema.string.optional({}, [
           rules.requiredWhen('role', '=', 'organization')
        ])
      })

      const data = await request.validate({ schema: userSchema })

      // Logic: Get Role ID
      const roleName = data.role === 'organization' ? 'organization' : 'volunteer'
      const role = await Role.findBy('slug', roleName) // Assuming roles are seeded with slugs: admin, organization, volunteer

      const user = new User()
      user.email = data.email
      user.password = data.password
      user.firstName = data.firstName
      user.lastName = data.lastName

      if (role) {
          user.roleId = role.id
      }

      // Logic: Status
      if (data.role === 'organization') {
          user.status = 'pending' // Org needs approval
      } else {
          user.status = 'active'
      }

      await user.save()

      // Logic: If Org, create Organization record
      if (data.role === 'organization' && data.organizationName) {
          await Organization.create({
              name: data.organizationName,
              ownerId: user.id,
              status: 'pending'
          })
      }

      const token = await auth.use('api').generate(user)

      return response.json({
          token,
          user: {
              id: user.id,
              email: user.email,
              role: roleName,
              status: user.status
          }
      })
    } catch (error) {
      return response.badRequest({
        error: { message: 'Unable to register', details: error.messages || error.message }
      })
    }
  }

  public async login({ request, response, auth }: HttpContextContract) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const token = await auth.use('api').attempt(email, password)
      const user = auth.use('api').user!

      if (user.status === 'banned') {
          await auth.use('api').revoke()
          return response.forbidden({ error: { message: 'Account is banned' } })
      }

      await user.load('role')
      // Ensure we have a role name
      const roleName = user.role?.slug || user.role?.name || 'volunteer'

      return response.json({
          token,
          user: {
              id: user.id,
              email: user.email,
              role: roleName.toLowerCase(), // 'admin', 'organization', 'volunteer'
              status: user.status
          }
      })
    } catch (error) {
      return response.unauthorized({
        error: { message: 'Invalid credentials' }
      })
    }
  }

  public async logout({ response, auth }: HttpContextContract) {
    try {
      await auth.use('api').revoke()
      return response.json({ message: 'Logout successful' })
    } catch (error) {
      return response.badRequest({
        error: { message: 'Unable to logout' }
      })
    }
  }
}
