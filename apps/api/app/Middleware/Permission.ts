import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import AuthorizationService from 'App/Services/AuthorizationService'

export default class PermissionMiddleware {
  public async handle(
    { auth, response }: HttpContextContract,
    next: () => Promise<void>,
    params: string[]
  ) {
    await auth.check()
    const user = auth.user
    if (!user) return response.unauthorized()

    const permission = params && params[0]
    if (!permission) return response.forbidden()

    const allowed = await AuthorizationService.userHasPermission(user, permission)
    if (!allowed) return response.forbidden()

    await next()
  }
}
