import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import AchievementCategory from 'App/Models/AchievementCategory'
import User from 'App/Models/User'

export default class AchievementCategoriesController {
  /**
   * List all achievement categories
   */
  public async index({ response }: HttpContextContract) {
    const categories = await AchievementCategory.query()
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')

    return response.ok(categories)
  }

  /**
   * Create a new achievement category (admin only)
   */
  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user as User

    if (!user.isAdmin) {
      return response.unauthorized({
        error: { message: 'Only admins can create achievement categories' }
      })
    }

    const payload = request.only(['name', 'description', 'icon', 'sortOrder'])

    const category = await AchievementCategory.create({
      name: payload.name,
      description: payload.description,
      icon: payload.icon,
      sortOrder: payload.sortOrder ?? 0
    })

    return response.created(category)
  }

  /**
   * Show a single achievement category
   */
  public async show({ params, response }: HttpContextContract) {
    const category = await AchievementCategory.query()
      .where('id', params.id)
      .preload('achievements')
      .first()

    if (!category) {
      return response.notFound({ error: { message: 'Category not found' } })
    }

    return response.ok(category)
  }

  /**
   * Update an achievement category (admin only)
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user as User

    if (!user.isAdmin) {
      return response.unauthorized({
        error: { message: 'Only admins can update achievement categories' }
      })
    }

    const category = await AchievementCategory.find(params.id)
    if (!category) {
      return response.notFound({ error: { message: 'Category not found' } })
    }

    const payload = request.only(['name', 'description', 'icon', 'sortOrder'])

    category.merge({
      name: payload.name ?? category.name,
      description: payload.description ?? category.description,
      icon: payload.icon ?? category.icon,
      sortOrder: payload.sortOrder ?? category.sortOrder
    })

    await category.save()
    return response.ok(category)
  }

  /**
   * Delete an achievement category (admin only)
   */
  public async destroy({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user as User

    if (!user.isAdmin) {
      return response.unauthorized({
        error: { message: 'Only admins can delete achievement categories' }
      })
    }

    const category = await AchievementCategory.find(params.id)
    if (!category) {
      return response.notFound({ error: { message: 'Category not found' } })
    }

    await category.delete()
    return response.noContent()
  }
}
