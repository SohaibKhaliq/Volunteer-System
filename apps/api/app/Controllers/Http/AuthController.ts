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
        lastName: schema.string.optional({ trim: true })
      })

      const data = await request.validate({ schema: userSchema })

      const user = await User.create(data)
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
