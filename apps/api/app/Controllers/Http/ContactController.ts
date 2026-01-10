import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Mail from '@ioc:Adonis/Addons/Mail'

import ContactSubmission from 'App/Models/ContactSubmission'
import AuditLog from 'App/Models/AuditLog'

export default class ContactController {
  /**
   * Submit Contact Form (Public)
   * Steps:
   * 1. Validate required fields
   * 2. Store submission
   * 3. Optionally notify admin
   * 4. Return success
   *
   * @route POST /contact
   * @tags Contact Form
   * @requestBody {
   *   "required": true,
   *   "content": {
   *     "application/json": {
   *       "schema": {
   *         "type": "object",
   *         "required": ["firstName", "email", "message"],
   *         "properties": {
   *           "firstName": {"type": "string", "example": "Jane"},
   *           "lastName": {"type": "string", "example": "Smith"},
   *           "email": {"type": "string", "format": "email", "example": "jane@example.com"},
   *           "phone": {"type": "string", "example": "+1234567890"},
   *           "subject": {"type": "string", "example": "Volunteer Inquiry"},
   *           "message": {"type": "string", "minLength": 10, "example": "I would like to volunteer..."}
   *         }
   *       }
   *     }
   *   }
   * }
   * @response 201 {
   *   "message": "Message sent successfully. We will get back to you soon.",
   *   "submissionId": 1
   * }
   * @response 400 {"error": {"message": "Validation failed", "details": {}}}
   * @response 500 {"error": {"message": "Failed to save message"}}
   */
  public async store({ request, response }: HttpContextContract) {
    const contactSchema = schema.create({
      firstName: schema.string({ trim: true }),
      lastName: schema.string.optional({ trim: true }),
      email: schema.string({ trim: true }, [rules.email()]),
      phone: schema.string.optional({ trim: true }),
      subject: schema.string.optional({ trim: true }),
      message: schema.string({ trim: true }, [rules.minLength(10)])
    })

    try {
      // Step 1: Validate required fields
      const data = await request.validate({ schema: contactSchema })

      // Step 2: Store submission
      const submission = await ContactSubmission.create({
        ...data,
        status: 'unread',
        ipAddress: request.ip(),
        userAgent: request.header('user-agent')
      })

      Logger.info('Contact form submission saved:', {
        id: submission.id,
        email: data.email,
        subject: data.subject
      })

      // Step 3: Optionally notify admin
      try {
        await Mail.send((message) => {
          message
            .from('noreply@volunteersystem.com')
            .to('admin@volunteersystem.com')
            .subject(`New Contact Form Submission: ${data.subject || 'No Subject'}`)
            .htmlView('emails/contact_notification', {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              subject: data.subject,
              message: data.message,
              submissionId: submission.id
            })
        })
      } catch (mailError) {
        Logger.warn('Failed to send admin notification email:', mailError)
        // Don't fail the request if email fails
      }

      // Log contact submission
      await AuditLog.safeCreate({
        userId: null,
        action: 'contact_form',
        details: `Contact form submitted by ${data.email}`,
        ipAddress: request.ip()
      })

      // Step 4: Return success
      return response.created({
        message: 'Message sent successfully. We will get back to you soon.',
        submissionId: submission.id
      })
    } catch (error) {
      Logger.error('Contact form submission error:', error)

      if (error.messages) {
        return response.badRequest({
          error: {
            message: 'Validation failed',
            details: error.messages
          }
        })
      }

      return response.internalServerError({
        error: { message: 'Failed to save message. Please try again.' }
      })
    }
  }

  /**
   * Get all contact submissions (Admin only)
   *
   * @route GET /contact
   * @tags Contact Form
   * @security bearerAuth: []
   * @queryParam page {number} - Page number (default: 1)
   * @queryParam limit {number} - Items per page (default: 10)
   * @queryParam status {string} - Filter by status: unread, read, replied, resolved, archived
   * @queryParam search {string} - Search by email, name, or subject
   * @response 200 {
   *   "data": [{"id": 1, "firstName": "Jane", "email": "jane@example.com", "subject": "Inquiry", "status": "unread"}],
   *   "meta": {"current_page": 1, "per_page": 10, "total": 5}
   * }
   * @response 401 {"error": {"message": "Not authenticated"}}
   * @response 403 {"error": {"message": "Insufficient permissions"}}
   */
  public async index({ request, response, auth }: HttpContextContract) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const status = request.input('status')
      const search = request.input('search')

      const query = ContactSubmission.query().orderBy('created_at', 'desc')

      // Filter by status
      if (status) {
        query.where('status', status)
      }

      // Search by email, name, or subject
      if (search) {
        query.where((builder) => {
          builder
            .where('email', 'LIKE', `%${search}%`)
            .orWhere('first_name', 'LIKE', `%${search}%`)
            .orWhere('last_name', 'LIKE', `%${search}%`)
            .orWhere('subject', 'LIKE', `%${search}%`)
        })
      }

      const submissions = await query.paginate(page, limit)

      return response.ok(submissions)
    } catch (error) {
      Logger.error('Get contact submissions error:', error)
      return response.internalServerError({
        error: { message: 'Failed to fetch submissions' }
      })
    }
  }

  /**
   * Get a single contact submission (Admin only)
   *
   * @route GET /contact/:id
   * @tags Contact Form
   * @security bearerAuth: []
   * @param id {number} - Submission ID
   * @response 200 {"submission": {"id": 1, "firstName": "Jane", "email": "jane@example.com", "message": "...", "status": "unread"}}
   * @response 401 {"error": {"message": "Not authenticated"}}
   * @response 404 {"error": {"message": "Submission not found"}}
   */
  public async show({ response, params }: HttpContextContract) {
    try {
      const submission = await ContactSubmission.findOrFail(params.id)

      return response.ok({ submission })
    } catch (error) {
      Logger.error('Get contact submission error:', error)

      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          error: { message: 'Submission not found' }
        })
      }

      return response.internalServerError({
        error: { message: 'Failed to fetch submission' }
      })
    }
  }

  /**
   * Update contact submission status (Admin only)
   *
   * @route PATCH /contact/:id
   * @tags Contact Form
   * @security bearerAuth: []
   * @param id {number} - Submission ID
   * @requestBody {
   *   "required": true,
   *   "content": {
   *     "application/json": {
   *       "schema": {
   *         "type": "object",
   *         "required": ["status"],
   *         "properties": {
   *           "status": {"type": "string", "enum": ["unread", "read", "replied", "resolved", "archived"]}
   *         }
   *       }
   *     }
   *   }
   * }
   * @response 200 {"submission": {}, "message": "Status updated successfully"}
   * @response 401 {"error": {"message": "Not authenticated"}}
   * @response 404 {"error": {"message": "Submission not found"}}
   */
  public async update({ request, response, params, auth }: HttpContextContract) {
    try {
      const updateSchema = schema.create({
        status: schema.enum(['unread', 'read', 'replied', 'resolved', 'archived'] as const)
      })

      const { status } = await request.validate({ schema: updateSchema })
      const submission = await ContactSubmission.findOrFail(params.id)

      submission.status = status
      await submission.save()

      // Log status update
      await AuditLog.safeCreate({
        userId: auth.use('api').user?.id || null,
        action: 'update_contact_status',
        details: `Contact submission #${submission.id} marked as ${status}`,
        ipAddress: request.ip()
      })

      return response.ok({
        submission,
        message: 'Status updated successfully'
      })
    } catch (error) {
      Logger.error('Update contact submission error:', error)

      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          error: { message: 'Submission not found' }
        })
      }

      if (error.messages) {
        return response.badRequest({
          error: {
            message: 'Validation failed',
            details: error.messages
          }
        })
      }

      return response.internalServerError({
        error: { message: 'Failed to update submission' }
      })
    }
  }

  /**
   * Delete a contact submission (Admin only)
   *
   * @route DELETE /contact/:id
   * @tags Contact Form
   * @security bearerAuth: []
   * @param id {number} - Submission ID
   * @response 200 {"message": "Submission deleted successfully"}
   * @response 401 {"error": {"message": "Not authenticated"}}
   * @response 404 {"error": {"message": "Submission not found"}}
   */
  public async destroy({ response, params, auth }: HttpContextContract) {
    try {
      const submission = await ContactSubmission.findOrFail(params.id)

      // Log before deletion
      await AuditLog.safeCreate({
        userId: auth.use('api').user?.id || null,
        action: 'delete_contact',
        details: `Contact submission #${submission.id} from ${submission.email} deleted`,
        ipAddress: null
      })

      await submission.delete()

      return response.ok({
        message: 'Submission deleted successfully'
      })
    } catch (error) {
      Logger.error('Delete contact submission error:', error)

      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          error: { message: 'Submission not found' }
        })
      }

      return response.internalServerError({
        error: { message: 'Failed to delete submission' }
      })
    }
  }
}
