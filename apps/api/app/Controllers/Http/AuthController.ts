
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'

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
        role: schema.enum.optional(['volunteer', 'organization'] as const),
      })

      const data = await request.validate({ schema: userSchema })

      // Extract role before creating user to avoid dirty data if not in model directly (though it's not in user table, it's a relation)
      const { role, ...userData } = data as any

      const user = await User.create(userData)

      // Assign role
      const Role = (await import('App/Models/Role')).default
      let roleName = role === 'organization' ? 'Organization Owner' : 'Volunteer'
      const roleRecord = await Role.findBy('name', roleName)

      // Fallback if seeded roles are different or missing
      if (roleRecord) {
        await user.related('roles').attach([roleRecord.id])
      }

      // If Organization, create a placeholder org
      if (role === 'organization') {
         const Organization = (await import('App/Models/Organization')).default
         const OrganizationTeamMember = (await import('App/Models/OrganizationTeamMember')).default

         const org = await Organization.create({
            name: `${user.firstName}'s Organization`,
            contactEmail: user.email,
            isApproved: false // Requires Admin approval
         })

         await OrganizationTeamMember.create({
            organizationId: org.id,
            userId: user.id,
            role: 'owner'
         })
      }

      const token = await auth.use('api').generate(user)

      return response.json({ token })
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
      return response.json({ token })
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
