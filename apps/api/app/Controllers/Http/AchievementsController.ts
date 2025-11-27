import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Achievement from 'App/Models/Achievement'
import User from 'App/Models/User'

export default class AchievementsController {
  // List achievements (optionally filter by organization)
  public async index({ request, response }: HttpContextContract) {
    const { organization_id } = request.qs()
    let query = Achievement.query().orderBy('id', 'desc')
    if (organization_id) query = query.where('organization_id', Number(organization_id))
    const rows = await query
    return response.ok(rows)
  }

  // Create a new achievement — if organization_id is provided, ensure caller belongs to org or is admin
  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user as User
    const payload = request.only([
      'organizationId',
      'key',
      'title',
      'description',
      'criteria',
      'icon',
      'points',
      'isEnabled'
    ])

    // If organizationId is set, ensure user belongs to that organization or is admin
    if (payload.organizationId && !user.isAdmin) {
      const orgIds = (user as any).organizations?.map((o: any) => o.id) ?? []
      if (!orgIds.includes(Number(payload.organizationId))) {
        return response.unauthorized({
          error: { message: 'Not authorized to manage achievements for this organization' }
        })
      }
    }

    const ach = await Achievement.create({
      organizationId: payload.organizationId,
      key: payload.key,
      title: payload.title,
      description: payload.description,
      criteria: payload.criteria,
      icon: payload.icon,
      points: payload.points ?? 0,
      isEnabled: payload.isEnabled ?? true
    })

    return response.created(ach)
  }

  public async show({ params, response }: HttpContextContract) {
    const ach = await Achievement.find(params.id)
    if (!ach) return response.notFound({ error: { message: 'Achievement not found' } })
    return response.ok(ach)
  }

  public async update({ params, request, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user as User
    const ach = await Achievement.find(params.id)
    if (!ach) return response.notFound({ error: { message: 'Achievement not found' } })

    if (ach.organizationId && !user.isAdmin) {
      const orgIds = (user as any).organizations?.map((o: any) => o.id) ?? []
      if (!orgIds.includes(Number(ach.organizationId))) {
        return response.unauthorized({
          error: { message: 'Not authorized to manage this achievement' }
        })
      }
    }

    const payload = request.only([
      'title',
      'description',
      'criteria',
      'icon',
      'points',
      'isEnabled'
    ])
    ach.merge({
      title: payload.title ?? ach.title,
      description: payload.description ?? ach.description,
      criteria: payload.criteria ?? ach.criteria,
      icon: payload.icon ?? ach.icon,
      points: payload.points ?? ach.points,
      isEnabled: payload.isEnabled ?? ach.isEnabled
    })
    await ach.save()
    return response.ok(ach)
  }

  public async destroy({ params, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user as User
    const ach = await Achievement.find(params.id)
    if (!ach) return response.notFound({ error: { message: 'Achievement not found' } })

    if (ach.organizationId && !user.isAdmin) {
      const orgIds = (user as any).organizations?.map((o: any) => o.id) ?? []
      if (!orgIds.includes(Number(ach.organizationId))) {
        return response.unauthorized({
          error: { message: 'Not authorized to manage this achievement' }
        })
      }
    }

    await ach.delete()
    return response.noContent()
  }
}
