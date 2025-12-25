import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import VolunteerHour from 'App/Models/VolunteerHour'
import AuditLog from 'App/Models/AuditLog'
import Notification from 'App/Models/Notification'
import Achievement from 'App/Models/Achievement'
import UserAchievement from 'App/Models/UserAchievement'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class VolunteerHoursController {
  public async index({ request, response }: HttpContextContract) {
    const { user_id } = request.qs()

    let query = VolunteerHour.query().preload('user').preload('event').orderBy('date', 'desc')

    if (user_id) {
      query = query.where('user_id', Number(user_id))
    }
    const hours = await query

    // Normalize Lucid models into plain objects for the frontend
    const mapped = hours.map((h) => {
      const attrs: any = (h as any).$attributes ?? (h as any).$original ?? h.toJSON()

      // user may be a Lucid relation with internals
      const rawUser = (h as any).$preloaded?.user ?? (h as any).user ?? attrs.user ?? null
      const userSrc = rawUser ? (rawUser.$attributes ?? rawUser.$original ?? rawUser) : null

      const rawEvent = (h as any).$preloaded?.event ?? (h as any).event ?? attrs.event ?? null
      const eventSrc = rawEvent ? (rawEvent.$attributes ?? rawEvent.$original ?? rawEvent) : null

      return {
        id: attrs.id,
        date: attrs.date ? (attrs.date.toString?.() ?? attrs.date) : attrs.date,
        hours: attrs.hours,
        status: attrs.status,
        createdAt: attrs.createdAt ?? attrs.created_at,
        updatedAt: attrs.updatedAt ?? attrs.updated_at,
        user: userSrc
          ? {
              id: userSrc.id,
              email: userSrc.email,
              firstName: userSrc.firstName ?? userSrc.first_name,
              lastName: userSrc.lastName ?? userSrc.last_name
            }
          : null,
        event: eventSrc
          ? {
              id: eventSrc.id,
              title: eventSrc.title
            }
          : null
      }
    })

    return response.ok(mapped)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const record = await VolunteerHour.find(params.id)
    if (!record) return response.notFound()

    // Security Check: Ensure auth user manages the organization for this event
    await record.load('event')
    if (record.event && record.event.organizationId) {
        const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
        const member = await OrganizationTeamMember.default.query()
            .where('user_id', auth.user!.id)
            .where('organization_id', record.event.organizationId)
            .first()

        // If strict mode, we should also check member.role for specific permissions
        if (!member) {
            return response.forbidden({ message: 'You do not have permission to manage hours for this organization' })
        }
    }

    const previousStatus = record.status
    record.merge(request.only(['status']))
    await record.save()
    // return a normalized shape
    const rec = record.toJSON() as any

    // Send notification to volunteer when hours are approved
    if (record.status === 'Approved' && previousStatus !== 'Approved') {
      try {
        await Notification.create({
          userId: record.userId,
          type: 'hours_approved',
          payload: JSON.stringify({
            volunteerHourId: record.id,
            hours: record.hours,
            date: record.date
          })
        })

        // Check for achievement milestones (10, 25, 50, 100, 500, 1000 hours)
        await this.checkAndAwardAchievements(record.userId)
      } catch (err) {
        console.warn('Failed to send hours approved notification or award achievements:', err)
      }
    }

    // Log this action so admins can audit status changes
    try {
      const user = auth.user!
      await AuditLog.safeCreate({
        userId: user.id,
        action: 'volunteer_hours_status_changed',
        details: JSON.stringify({
          previousStatus,
          newStatus: rec.status,
          hourId: rec.id,
          organizationId: record.event?.organizationId
        })
      })
    } catch (e) {
      // swallow logging errors
    }

    return response.ok({ id: rec.id, status: rec.status })
  }

  /**
   * Check total approved hours and award milestone achievements
   */
  private async checkAndAwardAchievements(userId: number) {
    try {
      // Calculate total approved hours
      const result = await VolunteerHour.query()
        .where('user_id', userId)
        .where('status', 'Approved')
        .sum('hours as total')

      const totalHours = Number(result[0]?.$extras?.total || 0)

      // Define achievement thresholds (in hours)
      const milestones = [
        {
          hours: 10,
          key: 'hours_10',
          title: '10 Hours',
          description: 'Completed 10 volunteer hours'
        },
        {
          hours: 25,
          key: 'hours_25',
          title: '25 Hours',
          description: 'Completed 25 volunteer hours'
        },
        {
          hours: 50,
          key: 'hours_50',
          title: '50 Hours',
          description: 'Completed 50 volunteer hours'
        },
        {
          hours: 100,
          key: 'hours_100',
          title: '100 Hours',
          description: 'Completed 100 volunteer hours'
        },
        {
          hours: 500,
          key: 'hours_500',
          title: '500 Hours',
          description: 'Completed 500 volunteer hours'
        },
        {
          hours: 1000,
          key: 'hours_1000',
          title: '1000 Hours',
          description: 'Completed 1000 volunteer hours'
        }
      ]

      // Get all milestone keys to check which achievements exist
      const milestoneKeys = milestones.map((m) => m.key)
      const existingAchievements = await Achievement.query().whereIn('key', milestoneKeys)
      const achievementMap = new Map(existingAchievements.map((a) => [a.key, a]))

      // Get user's existing achievements in one query
      const userAchievementIds = await UserAchievement.query()
        .where('user_id', userId)
        .select('achievement_id')
      const userAchievementIdSet = new Set(userAchievementIds.map((ua) => ua.achievementId))

      // Process each milestone
      for (const milestone of milestones) {
        if (totalHours >= milestone.hours) {
          // Get or create achievement
          let achievement = achievementMap.get(milestone.key)
          if (!achievement) {
            achievement = await Achievement.create({
              key: milestone.key,
              title: milestone.title,
              description: milestone.description,
              criteria: JSON.stringify({ hours: milestone.hours }),
              isEnabled: true
            })
            achievementMap.set(milestone.key, achievement)
          }

          // Award if not already earned
          if (!userAchievementIdSet.has(achievement.id)) {
            // Award achievement
            await UserAchievement.create({
              userId,
              achievementId: achievement.id,
              awardedAt: DateTime.now()
            })

            // Send notification
            await Notification.create({
              userId,
              type: 'achievement_earned',
              payload: JSON.stringify({
                achievementId: achievement.id,
                achievementTitle: achievement.title,
                achievementDescription: achievement.description
              })
            })
          }
        }
      }
    } catch (err) {
      console.warn('Failed to check and award achievements:', err)
    }
  }

  public async bulkUpdate({ auth, request, response }: HttpContextContract) {
    const { ids, status } = request.only(['ids', 'status'])
    
    // Security: Fetch all hours, preload events, and check permissions
    const hoursToCheck = await VolunteerHour.query()
        .whereIn('id', ids)
        .preload('event')

    if (hoursToCheck.length === 0) {
        return response.ok({ message: 'No records found' })
    }

    const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
    // Optimisation: Get the user's organization(s) first
    // Assuming user mostly belongs to one org, specifically relevant here
    const memberOrgs = await OrganizationTeamMember.default.query()
        .where('user_id', auth.user!.id)
        .select('organization_id')
    
    const allowedOrgIds = new Set(memberOrgs.map(m => m.organizationId))

    // Verify every hour record belongs to an allowed organization
    for (const h of hoursToCheck) {
        if (h.event && h.event.organizationId && !allowedOrgIds.has(h.event.organizationId)) {
             return response.forbidden({ message: `Permission denied for hour record ${h.id} belonging to organization ${h.event.organizationId}` })
        }
    }

    await VolunteerHour.query().whereIn('id', ids).update({ status })

    // If approving hours, send notifications and check achievements
    if (status === 'Approved') {
      try {
        const hours = await VolunteerHour.query().whereIn('id', ids)
        const userIds = [...new Set(hours.map((h) => h.userId))]

        for (const userId of userIds) {
          // Send notification
          const userHours = hours.filter((h) => h.userId === userId)
          const totalHours = userHours.reduce((sum, h) => sum + h.hours, 0)

          await Notification.create({
            userId,
            type: 'hours_approved',
            payload: JSON.stringify({
              count: userHours.length,
              totalHours
            })
          })

          // Check and award achievements
          await this.checkAndAwardAchievements(userId)
        }
      } catch (err) {
        console.warn('Failed to send bulk approval notifications or award achievements:', err)
      }
    }

    // Log bulk change
    try {
      const user = auth.user!
      await AuditLog.safeCreate({
        userId: user.id,
        action: 'volunteer_hours_bulk_update',
        details: JSON.stringify({ ids, newStatus: status, adminId: user.id })
      })
    } catch (e) {
      // ignore logging error
    }

    return response.ok({ message: 'Bulk update successful' })
  }
}
