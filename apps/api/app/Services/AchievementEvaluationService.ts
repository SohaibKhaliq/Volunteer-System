import Database from '@ioc:Adonis/Lucid/Database'
import Achievement from 'App/Models/Achievement'
import UserAchievement from 'App/Models/UserAchievement'
import AchievementProgress from 'App/Models/AchievementProgress'
import VolunteerHour from 'App/Models/VolunteerHour'
import Attendance from 'App/Models/Attendance'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'
import NotificationService from './NotificationService'
import AuditLog from 'App/Models/AuditLog'

/**
 * AchievementEvaluationService
 * 
 * Core service for evaluating achievement criteria and awarding achievements to volunteers.
 * Supports multiple rule types: hours, events, frequency, certification, and custom rules.
 */
export default class AchievementEvaluationService {
  /**
   * Evaluate all achievements for a specific user
   */
  public static async evaluateForUser(
    userId: number,
    achievementId?: number
  ): Promise<{ awarded: number; updated: number }> {
    let awarded = 0
    let updated = 0

    try {
      // Get achievements to evaluate
      let query = Achievement.query().where('is_enabled', true)
      if (achievementId) {
        query = query.where('id', achievementId)
      }
      const achievements = await query

      for (const achievement of achievements) {
        // Skip if user already has this achievement
        const existing = await UserAchievement.query()
          .where('user_id', userId)
          .where('achievement_id', achievement.id)
          .first()

        if (existing) {
          continue
        }

        // Evaluate based on rule type
        const result = await this.evaluateAchievement(userId, achievement)

        if (result.earned) {
          // Award achievement
          await this.awardAchievement(userId, achievement.id, result.metadata)
          awarded++
        } else if (achievement.isMilestone && result.progress) {
          // Update progress for milestone achievements
          await this.updateProgress(
            userId,
            achievement.id,
            result.progress.currentValue,
            result.progress.targetValue
          )
          updated++
        }
      }

      Logger.info(`Evaluated achievements for user ${userId}: ${awarded} awarded, ${updated} updated`)
      return { awarded, updated }
    } catch (error) {
      Logger.error('Achievement evaluation error for user %d: %o', userId, error)
      throw error
    }
  }

  /**
   * Evaluate a single achievement for a user
   */
  private static async evaluateAchievement(
    userId: number,
    achievement: Achievement
  ): Promise<{ earned: boolean; progress?: { currentValue: number; targetValue: number }; metadata?: any }> {
    switch (achievement.ruleType) {
      case 'hours':
        return await this.evaluateHoursAchievement(userId, achievement)
      case 'events':
        return await this.evaluateEventsAchievement(userId, achievement)
      case 'frequency':
        return await this.evaluateFrequencyAchievement(userId, achievement)
      case 'certification':
        return await this.evaluateCertificationAchievement(userId, achievement)
      case 'custom':
        return await this.evaluateCustomRule(userId, achievement)
      default:
        // Fallback to criteria-based evaluation
        return await this.evaluateCriteriaBasedRule(userId, achievement)
    }
  }

  /**
   * Evaluate hour-based achievement
   * Criteria format: { type: 'hours', threshold: 50, organizationId?: number, withinDays?: number }
   */
  private static async evaluateHoursAchievement(
    userId: number,
    achievement: Achievement
  ): Promise<{ earned: boolean; progress?: { currentValue: number; targetValue: number }; metadata?: any }> {
    const criteria = achievement.criteria || {}
    const threshold = criteria.threshold || 0
    const organizationId = criteria.organizationId || achievement.organizationId
    const withinDays = criteria.withinDays

    // Build query for approved volunteer hours
    let query = VolunteerHour.query()
      .where('user_id', userId)
      .where('status', 'Approved')

    if (organizationId) {
      query = query.where('organization_id', organizationId)
    }

    if (withinDays) {
      const cutoffDate = DateTime.now().minus({ days: withinDays })
      query = query.where('date', '>=', cutoffDate.toSQLDate())
    }

    const result = await query.sum('hours as total')
    const totalHours = Number(result[0]?.$extras?.total || 0)

    return {
      earned: totalHours >= threshold,
      progress: {
        currentValue: totalHours,
        targetValue: threshold
      },
      metadata: {
        totalHours,
        threshold,
        evaluatedAt: DateTime.now().toISO()
      }
    }
  }

  /**
   * Evaluate event participation achievement
   * Criteria format: { type: 'events', threshold: 10, organizationId?: number, withinDays?: number }
   */
  private static async evaluateEventsAchievement(
    userId: number,
    achievement: Achievement
  ): Promise<{ earned: boolean; progress?: { currentValue: number; targetValue: number }; metadata?: any }> {
    const criteria = achievement.criteria || {}
    const threshold = criteria.threshold || 0
    const organizationId = criteria.organizationId || achievement.organizationId
    const withinDays = criteria.withinDays

    // Count attended events
    let query = Attendance.query()
      .where('user_id', userId)
      .where('status', 'Present')

    if (organizationId) {
      query = query.whereHas('event', (eventQuery: any) => {
        eventQuery.where('organization_id', organizationId)
      })
    }

    if (withinDays) {
      const cutoffDate = DateTime.now().minus({ days: withinDays })
      query = query.where('date', '>=', cutoffDate.toSQLDate())
    }

    const count = await query.count('* as total')
    const totalEvents = Number(count[0]?.$extras?.total || 0)

    return {
      earned: totalEvents >= threshold,
      progress: {
        currentValue: totalEvents,
        targetValue: threshold
      },
      metadata: {
        totalEvents,
        threshold,
        evaluatedAt: DateTime.now().toISO()
      }
    }
  }

  /**
   * Evaluate frequency-based achievement (e.g., 3 consecutive months of participation)
   * Criteria format: { type: 'frequency', consecutiveMonths: 3, minHoursPerMonth: 5 }
   */
  private static async evaluateFrequencyAchievement(
    userId: number,
    achievement: Achievement
  ): Promise<{ earned: boolean; progress?: { currentValue: number; targetValue: number }; metadata?: any }> {
    const criteria = achievement.criteria || {}
    const consecutiveMonths = criteria.consecutiveMonths || 3
    const minHoursPerMonth = criteria.minHoursPerMonth || 1

    // Get volunteer hours grouped by month
    const monthlyHours = await Database.from('volunteer_hours')
      .select(Database.raw("DATE_FORMAT(date, '%Y-%m') as month"))
      .sum('hours as total')
      .where('user_id', userId)
      .where('status', 'Approved')
      .groupByRaw("DATE_FORMAT(date, '%Y-%m')")
      .orderBy('month', 'desc')

    // Check for consecutive months
    let consecutiveCount = 0
    let maxConsecutive = 0
    let lastMonth: DateTime | null = null

    for (const row of monthlyHours) {
      const monthStr = row.month as string
      const currentMonth = DateTime.fromFormat(monthStr, 'yyyy-MM')
      const hours = Number(row.total || 0)

      if (hours >= minHoursPerMonth) {
        if (!lastMonth || lastMonth.diff(currentMonth, 'months').months === 1) {
          consecutiveCount++
          maxConsecutive = Math.max(maxConsecutive, consecutiveCount)
        } else {
          consecutiveCount = 1
        }
        lastMonth = currentMonth
      } else {
        consecutiveCount = 0
      }
    }

    return {
      earned: maxConsecutive >= consecutiveMonths,
      progress: {
        currentValue: maxConsecutive,
        targetValue: consecutiveMonths
      },
      metadata: {
        maxConsecutiveMonths: maxConsecutive,
        requiredMonths: consecutiveMonths,
        evaluatedAt: DateTime.now().toISO()
      }
    }
  }

  /**
   * Evaluate certification-based achievement
   * Criteria format: { type: 'certification', requiredCertifications: ['First Aid', 'CPR'] }
   */
  private static async evaluateCertificationAchievement(
    userId: number,
    achievement: Achievement
  ): Promise<{ earned: boolean; metadata?: any }> {
    const criteria = achievement.criteria || {}
    const requiredCertifications = criteria.requiredCertifications || []

    if (!requiredCertifications.length) {
      return { earned: false }
    }

    // Check user's compliance documents for certifications
    const userCertifications = await Database.from('compliance_documents')
      .select('document_type')
      .where('user_id', userId)
      .where('status', 'Approved')
      .whereIn('document_type', requiredCertifications)

    const hasCertifications = userCertifications.map((doc) => doc.document_type)
    const hasAll = requiredCertifications.every((cert) => hasCertifications.includes(cert))

    return {
      earned: hasAll,
      metadata: {
        requiredCertifications,
        hasCertifications,
        evaluatedAt: DateTime.now().toISO()
      }
    }
  }

  /**
   * Evaluate custom rule (extensible for future complex rules)
   */
  private static async evaluateCustomRule(
    _userId: number,
    achievement: Achievement
  ): Promise<{ earned: boolean; metadata?: any }> {
    // Placeholder for custom rule evaluation
    // Can be extended to support JavaScript evaluation or other custom logic
    Logger.warn(`Custom rule evaluation not yet implemented for achievement ${achievement.id}`)
    return { earned: false }
  }

  /**
   * Fallback criteria-based evaluation for legacy achievements
   */
  private static async evaluateCriteriaBasedRule(
    userId: number,
    achievement: Achievement
  ): Promise<{ earned: boolean; metadata?: any }> {
    const criteria = achievement.criteria || {}

    // Detect type from criteria
    if (criteria.type === 'hours') {
      return await this.evaluateHoursAchievement(userId, achievement)
    } else if (criteria.type === 'events') {
      return await this.evaluateEventsAchievement(userId, achievement)
    }

    // Default: not earned
    return { earned: false }
  }

  /**
   * Award achievement to user
   */
  public static async awardAchievement(
    userId: number,
    achievementId: number,
    metadata?: any,
    grantedBy?: number,
    grantReason?: string
  ): Promise<UserAchievement> {
    try {
      // Check if already awarded
      const existing = await UserAchievement.query()
        .where('user_id', userId)
        .where('achievement_id', achievementId)
        .first()

      if (existing) {
        Logger.info(`Achievement ${achievementId} already awarded to user ${userId}`)
        return existing
      }

      // Award achievement
      const userAchievement = await UserAchievement.create({
        userId,
        achievementId,
        metadata,
        grantedBy,
        grantReason,
        awardedAt: DateTime.now()
      })

      // Load achievement details
      await userAchievement.load('achievement')

      // Send notification
      await NotificationService.createNotification({
        userId,
        type: 'achievement_earned',
        title: '🏆 Achievement Unlocked!',
        message: `You've earned the "${userAchievement.achievement.title}" achievement!`,
        actionUrl: '/volunteer/achievements',
        actionText: 'View Achievements'
      })

      // Create audit log
      await AuditLog.create({
        userId: grantedBy || userId,
        action: grantedBy ? 'achievement_granted' : 'achievement_earned',
        targetType: 'achievement',
        targetId: achievementId,
        metadata: JSON.stringify({
          recipientUserId: userId,
          achievementTitle: userAchievement.achievement.title,
          grantedBy,
          grantReason,
          automatic: !grantedBy
        })
      })

      Logger.info(`Achievement ${achievementId} awarded to user ${userId}`)
      return userAchievement
    } catch (error) {
      Logger.error('Error awarding achievement: %o', error)
      throw error
    }
  }

  /**
   * Update progress for milestone achievement
   */
  public static async updateProgress(
    userId: number,
    achievementId: number,
    currentValue: number,
    targetValue: number
  ): Promise<AchievementProgress> {
    const percentage = Math.min(Math.round((currentValue / targetValue) * 100), 100)

    const progress = await AchievementProgress.updateOrCreate(
      { userId, achievementId },
      {
        currentValue,
        targetValue,
        percentage,
        lastEvaluatedAt: DateTime.now()
      }
    )

    return progress
  }

  /**
   * Revoke achievement from user (admin only)
   */
  public static async revokeAchievement(
    userAchievementId: number,
    revokedBy: number,
    reason?: string
  ): Promise<void> {
    const userAchievement = await UserAchievement.findOrFail(userAchievementId)
    await userAchievement.load('achievement')

    // Create audit log before deletion
    await AuditLog.create({
      userId: revokedBy,
      action: 'achievement_revoked',
      targetType: 'achievement',
      targetId: userAchievement.achievementId,
      metadata: JSON.stringify({
        recipientUserId: userAchievement.userId,
        achievementTitle: userAchievement.achievement.title,
        revokedBy,
        reason
      })
    })

    await userAchievement.delete()
    Logger.info(`Achievement ${userAchievement.achievementId} revoked from user ${userAchievement.userId}`)
  }
}
