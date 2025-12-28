import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'

import ContactSubmission from 'App/Models/ContactSubmission'

export default class ContactController {
  public async store({ request, response }: HttpContextContract) {
    const data = request.only(['firstName', 'lastName', 'email', 'subject', 'message'])

    // Validate data (basic validation)
    if (!data.email || !data.message || !data.firstName) {
      return response.badRequest({ message: 'Missing required fields' })
    }

    try {
      await ContactSubmission.create({
        ...data,
        status: 'unread'
      })
      
      Logger.info('Contact form submission saved:', data.email)
      return response.ok({ message: 'Message sent successfully' })
    } catch (error) {
      Logger.error(error)
      return response.internalServerError({ message: 'Failed to save message' })
    }
  }

  public async index({ request, response, auth }: HttpContextContract) {
    // Ensure only admins can access (though route should handle this too)
    // if (!auth.user?.isAdmin) ... let's rely on middleware in routes
    
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const status = request.input('status')

    const query = ContactSubmission.query().orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    const submissions = await query.paginate(page, limit)
    return response.ok(submissions)
  }
}
