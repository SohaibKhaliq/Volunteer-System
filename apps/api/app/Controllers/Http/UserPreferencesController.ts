import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

import UserPreference from 'App/Models/UserPreference'
import AuditLog from 'App/Models/AuditLog'

export default class UserPreferencesController {
  /**
   * Get user preferences
   *
   * @route GET /preferences
   * @tags User Preferences
   * @security bearerAuth: []
   * @response 200 {
   *   "preferences": {
   *     "id": 1,
   *     "userId": 1,
   *     "emailNotifications": true,
   *     "smsNotifications": false,
   *     "pushNotifications": true,
   *     "newsletterSubscription": true,
   *     "eventReminders": true,
   *     "shiftReminders": true,
   *     "opportunityAlerts": true,
   *     "profilePublic": false,
   *     "showEmail": false,
   *     "showPhone": false,
   *     "preferredDays": ["monday", "wednesday"],
   *     "preferredTime": "morning",
   *     "maxHoursPerWeek": 20,
   *     "language": "en",
   *     "timezone": "Australia/Sydney",
   *     "theme": "light"
   *   }
   * }
   * @response 401 {"error": {"message": "Not authenticated"}}
   */
  public async show({ response, auth }: HttpContextContract) {
    try {
      const user = auth.use('api').user

      if (!user) {
        return response.unauthorized({
          error: { message: 'Not authenticated' }
        })
      }

      const preferences = await UserPreference.getForUser(user.id)

      return response.ok({
        preferences: {
          id: preferences.id,
          userId: preferences.userId,
          // Notification preferences
          emailNotifications: preferences.emailNotifications,
          smsNotifications: preferences.smsNotifications,
          pushNotifications: preferences.pushNotifications,
          // Communication preferences
          newsletterSubscription: preferences.newsletterSubscription,
          eventReminders: preferences.eventReminders,
          shiftReminders: preferences.shiftReminders,
          opportunityAlerts: preferences.opportunityAlerts,
          // Privacy preferences
          profilePublic: preferences.profilePublic,
          showEmail: preferences.showEmail,
          showPhone: preferences.showPhone,
          // Availability preferences
          preferredDays: preferences.preferredDays,
          preferredTime: preferences.preferredTime,
          maxHoursPerWeek: preferences.maxHoursPerWeek,
          // Other preferences
          language: preferences.language,
          timezone: preferences.timezone,
          theme: preferences.theme,
          customPreferences: preferences.customPreferences,
          // Timestamps
          createdAt: preferences.createdAt,
          updatedAt: preferences.updatedAt
        }
      })
    } catch (error) {
      Logger.error('Get preferences error:', error)
      return response.internalServerError({
        error: { message: 'Unable to fetch preferences' }
      })
    }
  }

  /**
   * Update user preferences
   *
   * @route PUT /preferences
   * @tags User Preferences
   * @security bearerAuth: []
   * @requestBody {
   *   "required": true,
   *   "content": {
   *     "application/json": {
   *       "schema": {
   *         "type": "object",
   *         "properties": {
   *           "emailNotifications": {"type": "boolean"},
   *           "smsNotifications": {"type": "boolean"},
   *           "pushNotifications": {"type": "boolean"},
   *           "theme": {"type": "string", "enum": ["light", "dark", "auto"]},
   *           "language": {"type": "string"},
   *           "timezone": {"type": "string"},
   *           "preferredDays": {"type": "array", "items": {"type": "string"}},
   *           "preferredTime": {"type": "string", "enum": ["morning", "afternoon", "evening", "flexible"]},
   *           "maxHoursPerWeek": {"type": "number", "minimum": 0, "maximum": 168}
   *         }
   *       }
   *     }
   *   }
   * }
   * @response 200 {"preferences": {}, "message": "Preferences updated successfully"}
   * @response 401 {"error": {"message": "Not authenticated"}}
   */
  public async update({ request, response, auth }: HttpContextContract) {
    try {
      const user = auth.use('api').user

      if (!user) {
        return response.unauthorized({
          error: { message: 'Not authenticated' }
        })
      }

      const preferencesSchema = schema.create({
        // Notification preferences
        emailNotifications: schema.boolean.optional(),
        smsNotifications: schema.boolean.optional(),
        pushNotifications: schema.boolean.optional(),
        // Communication preferences
        newsletterSubscription: schema.boolean.optional(),
        eventReminders: schema.boolean.optional(),
        shiftReminders: schema.boolean.optional(),
        opportunityAlerts: schema.boolean.optional(),
        // Privacy preferences
        profilePublic: schema.boolean.optional(),
        showEmail: schema.boolean.optional(),
        showPhone: schema.boolean.optional(),
        // Availability preferences
        preferredDays: schema.array.optional().anyMembers(),
        preferredTime: schema.enum.optional([
          'morning',
          'afternoon',
          'evening',
          'flexible'
        ] as const),
        maxHoursPerWeek: schema.number.optional([rules.range(0, 168)]),
        // Other preferences
        language: schema.string.optional({ trim: true }),
        timezone: schema.string.optional({ trim: true }),
        theme: schema.enum.optional(['light', 'dark', 'auto'] as const),
        customPreferences: schema.object.optional().anyMembers()
      })

      const validatedData = await request.validate({ schema: preferencesSchema })

      const preferences = await UserPreference.getForUser(user.id)

      // Update only provided fields
      preferences.merge(validatedData)
      await preferences.save()

      // Log preference update
      await AuditLog.safeCreate({
        userId: user.id,
        action: 'update_preferences',
        details: 'User preferences updated',
        ipAddress: request.ip()
      })

      return response.ok({
        preferences,
        message: 'Preferences updated successfully'
      })
    } catch (error) {
      Logger.error('Update preferences error:', error)

      if (error.messages) {
        return response.badRequest({
          error: {
            message: 'Validation failed',
            details: error.messages
          }
        })
      }

      return response.internalServerError({
        error: { message: 'Unable to update preferences' }
      })
    }
  }

  /**
   * Reset preferences to defaults
   *
   * @route POST /preferences/reset
   * @tags User Preferences
   * @security bearerAuth: []
   * @response 200 {"preferences": {}, "message": "Preferences reset to defaults"}
   * @response 401 {"error": {"message": "Not authenticated"}}
   */
  public async reset({ request, response, auth }: HttpContextContract) {
    try {
      const user = auth.use('api').user

      if (!user) {
        return response.unauthorized({
          error: { message: 'Not authenticated' }
        })
      }

      const preferences = await UserPreference.getForUser(user.id)
      await preferences.resetToDefaults()

      // Log preference reset
      await AuditLog.safeCreate({
        userId: user.id,
        action: 'reset_preferences',
        details: 'User preferences reset to defaults',
        ipAddress: request.ip()
      })

      return response.ok({
        preferences,
        message: 'Preferences reset to defaults'
      })
    } catch (error) {
      Logger.error('Reset preferences error:', error)
      return response.internalServerError({
        error: { message: 'Unable to reset preferences' }
      })
    }
  }

  /**
   * Update a specific preference category
   *
   * @route PATCH /preferences/:category
   * @tags User Preferences
   * @security bearerAuth: []
   * @param category {string} - Category: notifications, communication, privacy, availability, general
   * @requestBody {
   *   "required": true,
   *   "content": {
   *     "application/json": {
   *       "schema": {"type": "object", "properties": {"emailNotifications": {"type": "boolean"}}}
   *     }
   *   }
   * }
   * @response 200 {"preferences": {}, "message": "{category} preferences updated successfully"}
   * @response 400 {"error": {"message": "Invalid preference category"}}
   * @response 401 {"error": {"message": "Not authenticated"}}
   */
  public async updateCategory({ request, response, auth, params }: HttpContextContract) {
    try {
      const user = auth.use('api').user

      if (!user) {
        return response.unauthorized({
          error: { message: 'Not authenticated' }
        })
      }

      const { category } = params
      const updates = request.all()

      const validCategories = [
        'notifications',
        'communication',
        'privacy',
        'availability',
        'general'
      ]
      if (!validCategories.includes(category)) {
        return response.badRequest({
          error: { message: 'Invalid preference category' }
        })
      }

      const preferences = await UserPreference.getForUser(user.id)

      // Update based on category
      switch (category) {
        case 'notifications':
          if (updates.emailNotifications !== undefined)
            preferences.emailNotifications = updates.emailNotifications
          if (updates.smsNotifications !== undefined)
            preferences.smsNotifications = updates.smsNotifications
          if (updates.pushNotifications !== undefined)
            preferences.pushNotifications = updates.pushNotifications
          break

        case 'communication':
          if (updates.newsletterSubscription !== undefined)
            preferences.newsletterSubscription = updates.newsletterSubscription
          if (updates.eventReminders !== undefined)
            preferences.eventReminders = updates.eventReminders
          if (updates.shiftReminders !== undefined)
            preferences.shiftReminders = updates.shiftReminders
          if (updates.opportunityAlerts !== undefined)
            preferences.opportunityAlerts = updates.opportunityAlerts
          break

        case 'privacy':
          if (updates.profilePublic !== undefined) preferences.profilePublic = updates.profilePublic
          if (updates.showEmail !== undefined) preferences.showEmail = updates.showEmail
          if (updates.showPhone !== undefined) preferences.showPhone = updates.showPhone
          break

        case 'availability':
          if (updates.preferredDays !== undefined) preferences.preferredDays = updates.preferredDays
          if (updates.preferredTime !== undefined) preferences.preferredTime = updates.preferredTime
          if (updates.maxHoursPerWeek !== undefined)
            preferences.maxHoursPerWeek = updates.maxHoursPerWeek
          break

        case 'general':
          if (updates.language !== undefined) preferences.language = updates.language
          if (updates.timezone !== undefined) preferences.timezone = updates.timezone
          if (updates.theme !== undefined) preferences.theme = updates.theme
          break
      }

      await preferences.save()

      // Log category update
      await AuditLog.safeCreate({
        userId: user.id,
        action: 'update_preferences',
        details: `User ${category} preferences updated`,
        ipAddress: request.ip()
      })

      return response.ok({
        preferences,
        message: `${category} preferences updated successfully`
      })
    } catch (error) {
      Logger.error('Update category preferences error:', error)
      return response.internalServerError({
        error: { message: 'Unable to update preferences' }
      })
    }
  }
}
