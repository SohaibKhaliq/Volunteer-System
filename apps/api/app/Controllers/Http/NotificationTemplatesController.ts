import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import SystemSetting from 'App/Models/SystemSetting'

/**
 * NotificationTemplatesController - Manage email and notification templates
 *
 * Features:
 * - CRUD for notification templates
 * - Template types: invite, approval, reminder, etc.
 * - Variable substitution preview
 * - Default templates
 */

// Default templates
const DEFAULT_TEMPLATES = {
  invite_email: {
    subject: 'You\'ve been invited to join {{organization_name}}',
    body: `Hello {{recipient_name}},

You have been invited to join {{organization_name}} as a {{role}}.

{{#if message}}
Message from the organizer:
{{message}}
{{/if}}

Click the link below to accept the invitation:
{{accept_url}}

If you did not expect this invitation, you can safely ignore this email.

Best regards,
{{organization_name}} Team`
  },
  application_accepted: {
    subject: 'Your application has been accepted - {{opportunity_title}}',
    body: `Hello {{volunteer_name}},

Great news! Your application for "{{opportunity_title}}" has been accepted.

Event Details:
- Date: {{event_date}}
- Time: {{event_time}}
- Location: {{event_location}}

{{#if notes}}
Note from the organizer:
{{notes}}
{{/if}}

Please make sure to arrive on time. If you have any questions, feel free to contact us.

Best regards,
{{organization_name}} Team`
  },
  application_rejected: {
    subject: 'Application Update - {{opportunity_title}}',
    body: `Hello {{volunteer_name}},

Thank you for your interest in "{{opportunity_title}}".

Unfortunately, we are unable to accept your application at this time.

{{#if reason}}
Reason: {{reason}}
{{/if}}

We encourage you to apply for other opportunities with {{organization_name}}.

Best regards,
{{organization_name}} Team`
  },
  event_reminder: {
    subject: 'Reminder: {{event_title}} is coming up',
    body: `Hello {{volunteer_name}},

This is a reminder that you are scheduled for "{{event_title}}".

Event Details:
- Date: {{event_date}}
- Time: {{event_time}}
- Location: {{event_location}}

{{#if check_in_instructions}}
Check-in Instructions:
{{check_in_instructions}}
{{/if}}

Please arrive at least 15 minutes before the event starts.

See you there!
{{organization_name}} Team`
  },
  hours_approved: {
    subject: 'Your volunteer hours have been approved',
    body: `Hello {{volunteer_name}},

Your volunteer hours for {{event_title}} have been approved!

Hours: {{hours}}
Date: {{date}}

Total approved hours this month: {{monthly_total}}
Total approved hours all time: {{total_hours}}

Thank you for your dedication to volunteering!

Best regards,
{{organization_name}} Team`
  },
  welcome_volunteer: {
    subject: 'Welcome to {{organization_name}}!',
    body: `Hello {{volunteer_name}},

Welcome to {{organization_name}}! We're thrilled to have you as part of our volunteer community.

Here's how to get started:
1. Complete your profile
2. Browse available opportunities
3. Apply for events that interest you
4. Track your volunteer hours

If you have any questions, don't hesitate to reach out.

Happy volunteering!
{{organization_name}} Team`
  },
  password_reset: {
    subject: 'Reset your password',
    body: `Hello {{user_name}},

You requested to reset your password. Click the link below to set a new password:

{{reset_url}}

This link will expire in {{expiry_hours}} hours.

If you did not request a password reset, please ignore this email.

Best regards,
Volunteer System Team`
  }
}

export default class NotificationTemplatesController {
  /**
   * Check if user is admin
   */
  private async requireAdmin(auth: HttpContextContract['auth']) {
    await auth.use('api').authenticate()
    const user = auth.user!
    if (!user.isAdmin) {
      throw new Error('Admin access required')
    }
    return user
  }

  /**
   * List all notification templates
   */
  public async index({ auth, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      // Get stored templates from settings
      const storedTemplates = await SystemSetting.findBy('key', 'notification_templates')
      let templates = { ...DEFAULT_TEMPLATES }

      if (storedTemplates?.value) {
        try {
          const customTemplates = JSON.parse(storedTemplates.value)
          templates = { ...templates, ...customTemplates }
        } catch {
          // Use defaults if parse fails
        }
      }

      // Format for response
      const formattedTemplates = Object.entries(templates).map(([key, template]) => ({
        key,
        name: key
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        subject: (template as any).subject,
        body: (template as any).body,
        isDefault: DEFAULT_TEMPLATES.hasOwnProperty(key)
      }))

      return response.ok({
        templates: formattedTemplates,
        availableVariables: this.getAvailableVariables()
      })
    } catch (error) {
      Logger.error('List notification templates error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get a specific template
   */
  public async show({ auth, params, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const { key } = params

      // Get stored templates
      const storedTemplates = await SystemSetting.findBy('key', 'notification_templates')
      let templates = { ...DEFAULT_TEMPLATES }

      if (storedTemplates?.value) {
        try {
          const customTemplates = JSON.parse(storedTemplates.value)
          templates = { ...templates, ...customTemplates }
        } catch {
          // Use defaults
        }
      }

      const template = (templates as any)[key]
      if (!template) {
        return response.notFound({ error: { message: 'Template not found' } })
      }

      return response.ok({
        key,
        name: key
          .split('_')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        subject: template.subject,
        body: template.body,
        isDefault: DEFAULT_TEMPLATES.hasOwnProperty(key),
        defaultTemplate: (DEFAULT_TEMPLATES as any)[key] || null,
        variables: this.getVariablesForTemplate(key)
      })
    } catch (error) {
      Logger.error('Get notification template error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Update a template
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const { key } = params
      const { subject, body } = request.only(['subject', 'body'])

      if (!subject || !body) {
        return response.badRequest({ error: { message: 'Subject and body are required' } })
      }

      // Get existing custom templates
      let storedTemplates = await SystemSetting.findBy('key', 'notification_templates')
      let customTemplates: Record<string, any> = {}

      if (storedTemplates?.value) {
        try {
          customTemplates = JSON.parse(storedTemplates.value)
        } catch {
          customTemplates = {}
        }
      }

      // Update the template
      customTemplates[key] = { subject, body }

      // Save to settings
      await SystemSetting.updateOrCreate(
        { key: 'notification_templates' },
        { value: JSON.stringify(customTemplates) }
      )

      return response.ok({
        message: 'Template updated successfully',
        template: {
          key,
          subject,
          body
        }
      })
    } catch (error) {
      Logger.error('Update notification template error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Reset a template to default
   */
  public async reset({ auth, params, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const { key } = params

      // Check if default exists
      if (!(DEFAULT_TEMPLATES as any)[key]) {
        return response.notFound({ error: { message: 'No default template exists for this key' } })
      }

      // Get existing custom templates
      const storedTemplates = await SystemSetting.findBy('key', 'notification_templates')
      let customTemplates: Record<string, any> = {}

      if (storedTemplates?.value) {
        try {
          customTemplates = JSON.parse(storedTemplates.value)
        } catch {
          customTemplates = {}
        }
      }

      // Remove the custom override
      delete customTemplates[key]

      // Save to settings
      await SystemSetting.updateOrCreate(
        { key: 'notification_templates' },
        { value: JSON.stringify(customTemplates) }
      )

      const defaultTemplate = (DEFAULT_TEMPLATES as any)[key]

      return response.ok({
        message: 'Template reset to default',
        template: {
          key,
          subject: defaultTemplate.subject,
          body: defaultTemplate.body
        }
      })
    } catch (error) {
      Logger.error('Reset notification template error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Preview a template with sample data
   */
  public async preview({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const { key, subject, body, sampleData } = request.only([
        'key',
        'subject',
        'body',
        'sampleData'
      ])

      if (!subject || !body) {
        return response.badRequest({ error: { message: 'Subject and body are required' } })
      }

      // Default sample data
      const defaultSampleData: Record<string, string> = {
        recipient_name: 'John Doe',
        volunteer_name: 'John Doe',
        user_name: 'John Doe',
        organization_name: 'Sample Organization',
        opportunity_title: 'Community Cleanup Event',
        event_title: 'Community Cleanup Event',
        event_date: new Date().toLocaleDateString(),
        event_time: '10:00 AM - 2:00 PM',
        event_location: '123 Main Street, City',
        role: 'Volunteer',
        message: 'We would love to have you on our team!',
        accept_url: 'https://example.com/accept/abc123',
        reset_url: 'https://example.com/reset/xyz789',
        notes: 'Please bring comfortable shoes.',
        reason: 'Position has been filled.',
        hours: '4',
        date: new Date().toLocaleDateString(),
        monthly_total: '16',
        total_hours: '120',
        check_in_instructions: 'Please check in at the front desk.',
        expiry_hours: '24'
      }

      const data = { ...defaultSampleData, ...sampleData }

      // Simple template variable substitution
      const renderedSubject = this.renderTemplate(subject, data)
      const renderedBody = this.renderTemplate(body, data)

      return response.ok({
        subject: renderedSubject,
        body: renderedBody,
        sampleData: data
      })
    } catch (error) {
      Logger.error('Preview notification template error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Create a new custom template
   */
  public async store({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const { key, subject, body } = request.only(['key', 'subject', 'body'])

      if (!key || !subject || !body) {
        return response.badRequest({ error: { message: 'Key, subject, and body are required' } })
      }

      // Validate key format (snake_case)
      if (!/^[a-z][a-z0-9_]*$/.test(key)) {
        return response.badRequest({
          error: { message: 'Key must be in snake_case format (lowercase letters, numbers, and underscores)' }
        })
      }

      // Get existing custom templates
      const storedTemplates = await SystemSetting.findBy('key', 'notification_templates')
      let customTemplates: Record<string, any> = {}

      if (storedTemplates?.value) {
        try {
          customTemplates = JSON.parse(storedTemplates.value)
        } catch {
          customTemplates = {}
        }
      }

      // Check if key already exists
      if (customTemplates[key] || (DEFAULT_TEMPLATES as any)[key]) {
        return response.badRequest({ error: { message: 'Template with this key already exists' } })
      }

      // Add the new template
      customTemplates[key] = { subject, body }

      // Save to settings
      await SystemSetting.updateOrCreate(
        { key: 'notification_templates' },
        { value: JSON.stringify(customTemplates) }
      )

      return response.created({
        message: 'Template created successfully',
        template: {
          key,
          subject,
          body
        }
      })
    } catch (error) {
      Logger.error('Create notification template error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Delete a custom template
   */
  public async destroy({ auth, params, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const { key } = params

      // Cannot delete default templates
      if ((DEFAULT_TEMPLATES as any)[key]) {
        return response.badRequest({
          error: { message: 'Cannot delete default templates. Use reset to restore defaults.' }
        })
      }

      // Get existing custom templates
      const storedTemplates = await SystemSetting.findBy('key', 'notification_templates')
      let customTemplates: Record<string, any> = {}

      if (storedTemplates?.value) {
        try {
          customTemplates = JSON.parse(storedTemplates.value)
        } catch {
          customTemplates = {}
        }
      }

      if (!customTemplates[key]) {
        return response.notFound({ error: { message: 'Template not found' } })
      }

      // Remove the template
      delete customTemplates[key]

      // Save to settings
      await SystemSetting.updateOrCreate(
        { key: 'notification_templates' },
        { value: JSON.stringify(customTemplates) }
      )

      return response.ok({ message: 'Template deleted successfully' })
    } catch (error) {
      Logger.error('Delete notification template error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Simple template renderer (replace {{variable}} with values)
   */
  private renderTemplate(template: string, data: Record<string, string>): string {
    let result = template

    // Replace simple variables
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }

    // Handle {{#if variable}}...{{/if}} blocks (simple version)
    result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return data[varName] ? content : ''
    })

    return result
  }

  /**
   * Get available variables for templates
   */
  private getAvailableVariables() {
    return {
      common: [
        { name: 'recipient_name', description: 'Name of the email recipient' },
        { name: 'organization_name', description: 'Name of the organization' }
      ],
      volunteer: [
        { name: 'volunteer_name', description: 'Name of the volunteer' },
        { name: 'hours', description: 'Number of volunteer hours' },
        { name: 'total_hours', description: 'Total approved volunteer hours' },
        { name: 'monthly_total', description: 'Total hours this month' }
      ],
      event: [
        { name: 'event_title', description: 'Title of the event' },
        { name: 'opportunity_title', description: 'Title of the opportunity' },
        { name: 'event_date', description: 'Date of the event' },
        { name: 'event_time', description: 'Time of the event' },
        { name: 'event_location', description: 'Location of the event' },
        { name: 'check_in_instructions', description: 'Instructions for check-in' }
      ],
      invite: [
        { name: 'role', description: 'Role being invited for' },
        { name: 'message', description: 'Custom message from inviter' },
        { name: 'accept_url', description: 'URL to accept the invitation' }
      ],
      auth: [
        { name: 'user_name', description: 'Name of the user' },
        { name: 'reset_url', description: 'URL to reset password' },
        { name: 'expiry_hours', description: 'Hours until link expires' }
      ]
    }
  }

  /**
   * Get variables specific to a template type
   */
  private getVariablesForTemplate(key: string): string[] {
    const variableMap: Record<string, string[]> = {
      invite_email: [
        'recipient_name',
        'organization_name',
        'role',
        'message',
        'accept_url'
      ],
      application_accepted: [
        'volunteer_name',
        'organization_name',
        'opportunity_title',
        'event_date',
        'event_time',
        'event_location',
        'notes'
      ],
      application_rejected: [
        'volunteer_name',
        'organization_name',
        'opportunity_title',
        'reason'
      ],
      event_reminder: [
        'volunteer_name',
        'organization_name',
        'event_title',
        'event_date',
        'event_time',
        'event_location',
        'check_in_instructions'
      ],
      hours_approved: [
        'volunteer_name',
        'organization_name',
        'event_title',
        'hours',
        'date',
        'monthly_total',
        'total_hours'
      ],
      welcome_volunteer: ['volunteer_name', 'organization_name'],
      password_reset: ['user_name', 'reset_url', 'expiry_hours']
    }

    return variableMap[key] || []
  }
}
