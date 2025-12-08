import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CheckRole {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>, allowedRoles: string[]) {
    await auth.use('api').authenticate()

    // Assuming auth.user has role relationship loaded or we use role_id to fetch role name
    // For simplicity with prototype, let's map role_id to names manually or rely on 'roles' relation if robust
    // The previous code had a 'Role' model. Let's assume Role 1=Admin, 2=Org, 3=Volunteer for this exercise
    // Or simpler: User has a relationship 'role' we just added.
    const user = auth.user!

    if (user.status === 'banned') {
        return response.forbidden('User is banned')
    }

    if (allowedRoles.includes('*')) {
        await next()
        return
    }

    await user.load('role')
    const roleName = user.role?.name || ''

    if (!allowedRoles.includes(roleName)) {
        return response.forbidden('Insufficient permissions')
    }

    await next()
  }
}
