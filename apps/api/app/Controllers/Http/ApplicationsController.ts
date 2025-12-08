import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from 'App/Models/Application'
import Opportunity from 'App/Models/Opportunity'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import Notification from 'App/Models/Notification'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ApplicationsController {
  /**
   * Get applications for an opportunity
   */
  public async index({ params, request, response }: HttpContextContract) {
    const { opportunityId } = params
    const { page = 1, perPage = 20, status } = request.qs()

    const opportunity = await Opportunity.find(opportunityId)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    let query = Application.query()
      .where('opportunity_id', opportunityId)
      .preload('user')
      .orderBy('applied_at', 'desc')

    if (status) {
      query = query.where('status', status)
    }

    const applications = await query.paginate(page, perPage)

    return response.ok(applications)
  }

  /**
   * Apply to an opportunity
   */
  public async apply({ params, request, response, auth }: HttpContextContract) {
    const { id: opportunityId } = params
    const user = auth.user!

    const opportunity = await Opportunity.find(opportunityId)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    // Check if opportunity is published
    if (opportunity.status !== 'published') {
      return response.badRequest({ message: 'Cannot apply to unpublished opportunity' })
    }

    // Check if already applied
    const existing = await Application.query()
      .where('opportunity_id', opportunityId)
      .where('user_id', user.id)
      .first()

    if (existing) {
      return response.conflict({ message: 'You have already applied to this opportunity' })
    }

    // Note: Capacity check happens on acceptance, not on application
    // Applications are just requests; the capacity limit applies to accepted applications
    // This avoids race conditions on application creation

    const { notes } = request.only(['notes'])

    const application = await Application.create({
      opportunityId: parseInt(opportunityId, 10),
      userId: user.id,
      status: 'applied',
      appliedAt: DateTime.now(),
      notes
    })

    await application.load('user')
    await application.load('opportunity')

    // Send real-time notification to organization team members
    try {
      const orgTeamMembers = await OrganizationTeamMember.query()
        .where('organization_id', opportunity.organizationId)
        .select('user_id')

      for (const member of orgTeamMembers) {
        await Notification.create({
          userId: member.userId,
          type: 'new_application',
          payload: JSON.stringify({
            applicationId: application.id,
            opportunityId: opportunity.id,
            opportunityTitle: opportunity.title,
            volunteerId: user.id,
            volunteerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
          })
        })
      }
    } catch (err) {
      // Log but don't fail the request if notification fails
      console.warn('Failed to send application notification:', err)
    }

    return response.created({
      message: 'Application submitted successfully',
      application
    })
  }

  /**
   * Update application status (accept/reject)
   */
  public async update({ params, request, response }: HttpContextContract) {
    const application = await Application.find(params.id)
    if (!application) {
      return response.notFound({ message: 'Application not found' })
    }

    const { status, notes } = request.only(['status', 'notes'])

    if (!['accepted', 'rejected'].includes(status)) {
      return response.badRequest({ message: 'Invalid status. Use accepted or rejected.' })
    }

    // Check capacity before accepting
    if (status === 'accepted') {
      const opportunity = await Opportunity.find(application.opportunityId)
      if (opportunity && opportunity.capacity > 0) {
        const acceptedCount = await Application.query()
          .where('opportunity_id', application.opportunityId)
          .where('status', 'accepted')
          .where('id', '!=', application.id)
          .count('* as count')

        if (Number(acceptedCount[0].$extras.count) >= opportunity.capacity) {
          return response.badRequest({ message: 'Opportunity is at full capacity' })
        }
      }
    }

    application.status = status
    application.respondedAt = DateTime.now()
    if (notes) {
      application.notes = notes
    }
    await application.save()

    await application.load('user')

    // Send real-time notification to volunteer about application status change
    try {
      const opportunity = await Opportunity.find(application.opportunityId)
      await Notification.create({
        userId: application.userId,
        type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
        payload: JSON.stringify({
          applicationId: application.id,
          opportunityId: application.opportunityId,
          opportunityTitle: opportunity?.title || 'Opportunity',
          status
        })
      })
    } catch (err) {
      // Log but don't fail the request if notification fails
      console.warn('Failed to send application status notification:', err)
    }

    return response.ok({
      message: `Application ${status}`,
      application
    })
  }

  /**
   * Withdraw an application
   */
  public async withdraw({ params, response, auth }: HttpContextContract) {
    const application = await Application.find(params.id)
    if (!application) {
      return response.notFound({ message: 'Application not found' })
    }

    // Verify ownership
    if (application.userId !== auth.user?.id) {
      return response.forbidden({ message: 'You can only withdraw your own applications' })
    }

    if (application.status !== 'applied') {
      return response.badRequest({ message: 'Can only withdraw pending applications' })
    }

    await application.withdraw()

    return response.ok({ message: 'Application withdrawn' })
  }

  /**
   * Delete an application (admin only)
   */
  public async destroy({ params, response }: HttpContextContract) {
    const application = await Application.find(params.id)
    if (!application) {
      return response.notFound({ message: 'Application not found' })
    }

    await application.delete()

    return response.noContent()
  }

  /**
   * Get all applications for opportunities in an organization
   */
  public async organizationApplications({ params, request, response }: HttpContextContract) {
    const { organizationId } = params
    const { page = 1, perPage = 20, status, opportunity_id } = request.qs()

    let query = Application.query()
      .whereHas('opportunity', (builder) => {
        builder.where('organization_id', organizationId)
        if (opportunity_id) {
          builder.where('id', opportunity_id)
        }
      })
      .preload('user')
      .preload('opportunity')
      .orderBy('applied_at', 'desc')

    if (status) {
      query = query.where('status', status)
    }

    const applications = await query.paginate(page, perPage)

    return response.ok(applications)
  }

  /**
   * Get applications for opportunities in the current user's organization
   */
  public async myOrganizationApplications({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const { page = 1, perPage = 20, status, opportunity_id } = request.qs()

    let query = Application.query()
      .whereHas('opportunity', (builder) => {
        builder.where('organization_id', memberRecord.organizationId)
        if (opportunity_id) {
          builder.where('id', opportunity_id)
        }
      })
      .preload('user')
      .preload('opportunity')
      .orderBy('applied_at', 'desc')

    if (status) {
      query = query.where('status', status)
    }

    const applications = await query.paginate(page, perPage)

    return response.ok(applications)
  }

  /**
   * Bulk update applications
   */
  public async bulkUpdate({ request, response }: HttpContextContract) {
    const { ids, status, notes } = request.only(['ids', 'status', 'notes'])

    if (!Array.isArray(ids) || ids.length === 0) {
      return response.badRequest({ message: 'ids must be a non-empty array' })
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return response.badRequest({ message: 'Invalid status. Use accepted or rejected.' })
    }

    const updateData: any = {
      status,
      responded_at: DateTime.now().toSQL()
    }
    if (notes) {
      updateData.notes = notes
    }

    await Database.from('applications').whereIn('id', ids).update(updateData)

    return response.ok({ message: `${ids.length} applications updated to ${status}` })
  }
}
