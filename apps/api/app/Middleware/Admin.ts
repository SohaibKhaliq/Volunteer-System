import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class AdminMiddleware {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>) {
    await auth.check()
    const user = auth.user
    if (!user || !user.isAdmin) return response.forbidden()
    await next()
  }
}
