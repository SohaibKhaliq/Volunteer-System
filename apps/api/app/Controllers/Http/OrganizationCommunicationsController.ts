import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import Communication from 'App/Models/Communication'

export default class OrganizationCommunicationsController {
  /**
   * List all organization communications/messages
   */
  public async index({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId
    const { page = 1, limit = 20, type, status } = request.qs()

    let query = Communication.query().where('organization_id', orgId).orderBy('created_at', 'desc')

    if (type) {
      query = query.where('type', type)
    }
    if (status) {
      query = query.where('status', status)
    }

    const communications = await query.paginate(page, limit)

    return response.ok(communications)
  }

  /**
   * Send a new message/communication to volunteer(s)
   */
  public async send({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId
    const {
      recipients,
      subject,
      message,
      type = 'email',
      metadata
    } = request.only(['recipients', 'subject', 'message', 'type', 'metadata'])

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return response.badRequest({ message: 'recipients must be a non-empty array' })
    }

    // Verify all recipients belong to the organization
    const validRecipients = await Database.from('organization_volunteers')
      .where('organization_id', orgId)
      .whereIn('user_id', recipients)
      .select('user_id')

    if (validRecipients.length !== recipients.length) {
      return response.badRequest({
        message: 'Some recipients do not belong to your organization',
        valid_count: validRecipients.length,
        requested_count: recipients.length
      })
    }

    // Create communication record and schedule it for sending via the background sender.
    // Using 'Scheduled' status allows the CommunicationSender service to pick it up.
    const { DateTime } = await import('luxon')
    const communication = await Communication.create({
      organizationId: orgId,
      senderId: user.id,
      type,
      subject,
      content: message,
      recipients,
      metadata,
      status: 'Scheduled',
      sendAt: DateTime.local()
    })

    // Communication scheduled — the CommunicationSender background service
    // will pick up scheduled communications and dispatch them (email/notifications).

    return response.created({
      message: 'Communication sent successfully',
      communication
    })
  }

  /**
   * Get a specific communication/conversation
   */
  public async show({ auth, params, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const communication = await Communication.query()
      .where('id', params.id)
      .where('organization_id', memberRecord.organizationId)
      .first()

    if (!communication) {
      return response.notFound({ message: 'Communication not found' })
    }

    await communication.load('sender')

    return response.ok(communication)
  }

  /**
   * Broadcast a notification to all volunteers
   */
  public async broadcast({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId
    const {
      subject,
      message,
      type = 'notification',
      filter
    } = request.only(['subject', 'message', 'type', 'filter'])

    // Get all volunteers (or filtered subset)
    let query = Database.from('organization_volunteers').where('organization_id', orgId)

    if (filter?.status) {
      query = query.where('status', filter.status)
    }

    const volunteers = await query.select('user_id')
    const recipientIds = volunteers.map((v) => v.user_id)

    if (recipientIds.length === 0) {
      return response.badRequest({ message: 'No volunteers match the specified filter' })
    }

    // Create broadcast communication
    // schedule broadcast for background processing
    const { DateTime } = await import('luxon')
    const communication = await Communication.create({
      organizationId: orgId,
      senderId: user.id,
      type,
      subject,
      content: message,
      recipients: recipientIds,
      metadata: { broadcast: true, filter },
      status: 'Scheduled',
      sendAt: DateTime.local()
    })

    return response.created({
      message: `Broadcast sent to ${recipientIds.length} volunteers`,
      recipient_count: recipientIds.length,
      communication
    })
  }
}
