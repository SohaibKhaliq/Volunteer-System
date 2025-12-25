import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import NotificationPreference from 'App/Models/NotificationPreference'
import Logger from '@ioc:Adonis/Core/Logger'

export default class NotificationPreferencesController {
  /**
   * Get user's notification preferences
   */
  public async index({ auth, response }: HttpContextContract) {
    const user = auth.user!

    const preferences = await NotificationPreference.query().where('user_id', user.id)

    // Define default notification types
    const defaultTypes = [
      'volunteer_checked_in',
      'hours_pending_approval',
      'application_accepted',
      'application_rejected',
      'event_reminder',
      'hours_approved',
      'shift_assigned',
      'shift_cancelled',
      'broadcast',
      'compliance_update'
    ]

    // Merge with defaults
    const preferencesMap = new Map(preferences.map((p) => [p.notificationType, p]))
    const allPreferences = defaultTypes.map((type) => {
      if (preferencesMap.has(type)) {
        return preferencesMap.get(type)!
      }
      // Return default preference
      return {
        notificationType: type,
        inAppEnabled: true,
        emailEnabled: true,
        frequency: 'instant'
      }
    })

    return response.ok(allPreferences)
  }

  /**
   * Update user's notification preferences
   */
  public async update({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const { preferences } = request.only(['preferences'])

    if (!Array.isArray(preferences)) {
      return response.badRequest({ message: 'preferences must be an array' })
    }

    try {
      for (const pref of preferences) {
        const { notificationType, inAppEnabled, emailEnabled, frequency } = pref

        if (!notificationType) {
          continue
        }

        await NotificationPreference.updateOrCreate(
          { userId: user.id, notificationType },
          {
            inAppEnabled: inAppEnabled !== undefined ? inAppEnabled : true,
            emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
            frequency: frequency || 'instant'
          }
        )
      }

      return response.ok({ message: 'Preferences updated successfully' })
    } catch (error) {
      Logger.error('Failed to update notification preferences: %o', error)
      return response.internalServerError({ message: 'Failed to update preferences' })
    }
  }

  /**
   * Reset user's preferences to defaults
   */
  public async reset({ auth, response }: HttpContextContract) {
    const user = auth.user!

    try {
      await NotificationPreference.query().where('user_id', user.id).delete()
      return response.ok({ message: 'Preferences reset to defaults' })
    } catch (error) {
      Logger.error('Failed to reset notification preferences: %o', error)
      return response.internalServerError({ message: 'Failed to reset preferences' })
    }
  }
}
