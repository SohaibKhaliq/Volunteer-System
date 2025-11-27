import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'

export default class ContactController {
  public async store({ request, response }: HttpContextContract) {
    const data = request.only(['firstName', 'lastName', 'email', 'subject', 'message'])

    // Validate data (basic validation)
    if (!data.email || !data.message || !data.firstName) {
      return response.badRequest({ message: 'Missing required fields' })
    }

    // In a real app, we would send an email here or save to DB
    Logger.info('Contact form submission:', data)

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    return response.ok({ message: 'Message sent successfully' })
  }
}
