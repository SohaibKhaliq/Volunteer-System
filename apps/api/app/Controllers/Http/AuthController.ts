import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'

import User from '../../Models/User'
import Organization from '../../Models/Organization'

export default class AuthController {
  public async register({ request, response, auth }: HttpContextContract) {
    try {
      const { role, name, phone, address, description, ...userData } = request.all()

      const userSchema = schema.create({
        email: schema.string({ trim: true }, [
          rules.email(),
          rules.unique({ table: 'users', column: 'email', caseInsensitive: true })
        ]),
        password: schema.string({}, [rules.minLength(8)]),
        firstName: schema.string.optional({ trim: true }),
        lastName: schema.string.optional({ trim: true })
      })

      const validatedData = await request.validate({ schema: userSchema })

      const user = await User.create(validatedData)

      // If registering as an organization, create the organization record
      if (role === 'organization') {
        await Organization.create({
          name: name || `${validatedData.firstName || ''} ${validatedData.lastName || ''}`.trim(),
          description: description || null,
          contactEmail: validatedData.email,
          contactPhone: phone || null,
          address: address || null,
          ownerId: user.id,
          status: 'pending',
          isApproved: false,
          isActive: false
        })

        // Return token but indicate pending approval
        const token = await auth.use('api').generate(user)
        return response.json({
          token,
          message: 'Organization registration submitted for approval',
          status: 'pending'
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
