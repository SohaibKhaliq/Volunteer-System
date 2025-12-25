import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Achievement from 'App/Models/Achievement'
import AchievementProgress from 'App/Models/AchievementProgress'
import UserAchievement from 'App/Models/UserAchievement'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import AchievementEvaluationService from 'App/Services/AchievementEvaluationService'
import Logger from '@ioc:Adonis/Core/Logger'

export default class AchievementsController {
  // List achievements (optionally filter by organization and category)
  public async index({ request, response }: HttpContextContract) {
    const { organization_id, category_id, include_progress, user_id } = request.qs()
    
    let query = Achievement.query().orderBy('id', 'desc')
    
    if (organization_id) {
      query = query.where('organization_id', Number(organization_id))
    }
    
    if (category_id) {
      query = query.where('category_id', Number(category_id))
    }

    // Preload category
    query = query.preload('category')

    const achievements = await query

    // Include progress data if requested
    if (include_progress && user_id) {
      const progressData = await AchievementProgress.query()
        .where('user_id', Number(user_id))
        .whereIn('achievement_id', achievements.map(a => a.id))

      const progressMap = new Map(progressData.map(p => [p.achievementId, p]))

      return response.ok(achievements.map(ach => ({
        ...ach.toJSON(),
        progress: progressMap.get(ach.id) || null
      })))
    }

    return response.ok(achievements)
  }

  // Create a new achievement
  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user as User
    const payload = request.only([
      'organizationId',
      'categoryId',
      'key',
      'title',
      'description',
      'criteria',
      'ruleType',
      'isMilestone',
      'icon',
      'badgeImageUrl',
      'points',
      'isEnabled'
    ])

    // If organizationId is set, ensure user belongs to that organization or is admin
    if (payload.organizationId && !user.isAdmin) {
      const exists = await Database.from('organization_volunteers')
        .where({ user_id: user.id, organization_id: payload.organizationId })
        .first()
      if (!exists) {
        return response.unauthorized({
          error: { message: 'Not authorized to manage achievements for this organization' }
        })
      }
    }

    const ach = await Achievement.create({
      organizationId: payload.organizationId,
      categoryId: payload.categoryId,
      key: payload.key,
      title: payload.title,
      description: payload.description,
      criteria: payload.criteria,
      ruleType: payload.ruleType,
      isMilestone: payload.isMilestone ?? false,
      icon: payload.icon,
      badgeImageUrl: payload.badgeImageUrl,
      points: payload.points ?? 0,
      isEnabled: payload.isEnabled ?? true
    })

    await ach.load('category')
    return response.created(ach)
  }

  public async show({ params, response }: HttpContextContract) {
    const ach = await Achievement.query()
      .where('id', params.id)
      .preload('category')
      .first()
    
    if (!ach) return response.notFound({ error: { message: 'Achievement not found' } })
    return response.ok(ach)
  }

  public async update({ params, request, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user as User
    const ach = await Achievement.find(params.id)
    if (!ach) return response.notFound({ error: { message: 'Achievement not found' } })

    if (ach.organizationId && !user.isAdmin) {
      const exists = await Database.from('organization_volunteers')
        .where({ user_id: user.id, organization_id: ach.organizationId })
        .first()
      if (!exists) {
        return response.unauthorized({
          error: { message: 'Not authorized to manage this achievement' }
        })
      }
    }

    const payload = request.only([
      'categoryId',
      'title',
      'description',
      'criteria',
      'ruleType',
      'isMilestone',
      'icon',
      'badgeImageUrl',
      'points',
      'isEnabled'
    ])
    
    ach.merge({
      categoryId: payload.categoryId ?? ach.categoryId,
      title: payload.title ?? ach.title,
      description: payload.description ?? ach.description,
      criteria: payload.criteria ?? ach.criteria,
      ruleType: payload.ruleType ?? ach.ruleType,
      isMilestone: payload.isMilestone ?? ach.isMilestone,
      icon: payload.icon ?? ach.icon,
      badgeImageUrl: payload.badgeImageUrl ?? ach.badgeImageUrl,
      points: payload.points ?? ach.points,
      isEnabled: payload.isEnabled ?? ach.isEnabled
    })
    
    await ach.save()
    await ach.load('category')
    return response.ok(ach)
  }

  public async destroy({ params, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user as User
    const ach = await Achievement.find(params.id)
    if (!ach) return response.notFound({ error: { message: 'Achievement not found' } })

    if (ach.organizationId && !user.isAdmin) {
      const exists = await Database.from('organization_volunteers')
        .where({ user_id: user.id, organization_id: ach.organizationId })
        .first()
      if (!exists) {
        return response.unauthorized({
          error: { message: 'Not authorized to manage this achievement' }
        })
      }
    }

    await ach.delete()
    return response.noContent()
  }

  /**
   * Manually grant achievement to a user
   */
  public async grantAchievement({ auth, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const granter = auth.user as User
      const { userId, achievementId, reason } = request.only(['userId', 'achievementId', 'reason'])

      // Validate inputs
      if (!userId || !achievementId) {
        return response.badRequest({
          error: { message: 'userId and achievementId are required' }
        })
      }

      // Get achievement
      const achievement = await Achievement.find(achievementId)
      if (!achievement) {
        return response.notFound({ error: { message: 'Achievement not found' } })
      }

      // Check permissions
      if (achievement.organizationId && !granter.isAdmin) {
        const exists = await Database.from('organization_volunteers')
          .where({ user_id: granter.id, organization_id: achievement.organizationId })
          .where('role', 'admin')
          .first()
        if (!exists) {
          return response.unauthorized({
            error: { message: 'Not authorized to grant this achievement' }
          })
        }
      } else if (!achievement.organizationId && !granter.isAdmin) {
        return response.unauthorized({
          error: { message: 'Only admins can grant system-wide achievements' }
        })
      }

      // Award achievement
      const userAchievement = await AchievementEvaluationService.awardAchievement(
        userId,
        achievementId,
        { manuallyGranted: true },
        granter.id,
        reason
      )

      await userAchievement.load('achievement')
      await userAchievement.load('granter')

      return response.created({
        message: 'Achievement granted successfully',
        userAchievement
      })
    } catch (error) {
      Logger.error('Grant achievement error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to grant achievement' }
      })
    }
  }

  /**
   * Revoke achievement from a user
   */
  public async revokeAchievement({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const revoker = auth.user as User

      // Only admins can revoke achievements
      if (!revoker.isAdmin) {
        return response.unauthorized({
          error: { message: 'Only admins can revoke achievements' }
        })
      }

      const { reason } = request.only(['reason'])
      const userAchievementId = params.id

      await AchievementEvaluationService.revokeAchievement(
        userAchievementId,
        revoker.id,
        reason
      )

      return response.ok({ message: 'Achievement revoked successfully' })
    } catch (error) {
      Logger.error('Revoke achievement error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to revoke achievement' }
      })
    }
  }

  /**
   * Get achievement progress for a user
   */
  public async getProgress({ auth, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user as User
      const { userId, achievementId } = request.qs()

      // Users can only view their own progress unless they're admin
      const targetUserId = userId ? Number(userId) : user.id
      if (targetUserId !== user.id && !user.isAdmin) {
        return response.unauthorized({
          error: { message: 'Not authorized to view this progress' }
        })
      }

      let query = AchievementProgress.query()
        .where('user_id', targetUserId)
        .preload('achievement')

      if (achievementId) {
        query = query.where('achievement_id', Number(achievementId))
      }

      const progress = await query

      return response.ok(progress)
    } catch (error) {
      Logger.error('Get progress error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to get progress' }
      })
    }
  }

  /**
   * Manually trigger achievement evaluation
   */
  public async triggerEvaluation({ auth, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user as User

      // Only admins can trigger evaluation
      if (!user.isAdmin) {
        return response.unauthorized({
          error: { message: 'Only admins can trigger evaluation' }
        })
      }

      const { userId, achievementId } = request.only(['userId', 'achievementId'])

      if (userId) {
        const result = await AchievementEvaluationService.evaluateForUser(
          Number(userId),
          achievementId ? Number(achievementId) : undefined
        )
        return response.ok({
          message: 'Evaluation completed',
          awarded: result.awarded,
          updated: result.updated
        })
      }

      return response.badRequest({
        error: { message: 'userId is required for manual evaluation' }
      })
    } catch (error) {
      Logger.error('Trigger evaluation error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to trigger evaluation' }
      })
    }
  }
}
