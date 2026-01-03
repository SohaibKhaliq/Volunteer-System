import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import EngagementCampaign from 'App/Models/EngagementCampaign'
import Logger from '@ioc:Adonis/Core/Logger'

export default class EngagementCampaignsController {
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
   * List all engagement campaigns (admin only)
   * GET /admin/engagement-campaigns
   */
  public async index({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const { page = 1, perPage = 20, sent } = request.qs()

      const query = EngagementCampaign.query().orderBy('created_at', 'desc')

      if (sent !== undefined) {
        query.where('sent', sent === 'true' || sent === true)
      }

      const campaigns = await query.paginate(page, perPage)
      return response.ok(campaigns)
    } catch (error) {
      Logger.error('List engagement campaigns error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get a specific engagement campaign (admin only)
   * GET /admin/engagement-campaigns/:id
   */
  public async show({ auth, params, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const campaign = await EngagementCampaign.findOrFail(params.id)
      return response.ok(campaign)
    } catch (error) {
      Logger.error('Get engagement campaign error: %o', error)
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ error: { message: 'Engagement campaign not found' } })
      }
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get engagement campaign statistics (admin only)
   * GET /admin/engagement-campaigns/stats
   */
  public async stats({ auth, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const total = await EngagementCampaign.query().count('* as total')
      const sent = await EngagementCampaign.query().where('sent', true).count('* as total')
      const pending = await EngagementCampaign.query().where('sent', false).count('* as total')

      const stats = {
        total: total[0].$extras.total,
        sent: sent[0].$extras.total,
        pending: pending[0].$extras.total
      }

      return response.ok(stats)
    } catch (error) {
      Logger.error('Get engagement campaign stats error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Mark campaign as sent (admin only, should normally be done by system)
   * POST /admin/engagement-campaigns/:id/mark-sent
   */
  public async markSent({ auth, params, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const campaign = await EngagementCampaign.findOrFail(params.id)
      campaign.sent = true
      await campaign.save()

      return response.ok(campaign)
    } catch (error) {
      Logger.error('Mark campaign as sent error: %o', error)
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ error: { message: 'Engagement campaign not found' } })
      }
      return response.badRequest({ error: { message: error.message || 'Failed to mark as sent' } })
    }
  }

  /**
   * Delete an engagement campaign (admin only)
   * DELETE /admin/engagement-campaigns/:id
   */
  public async destroy({ auth, params, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const campaign = await EngagementCampaign.findOrFail(params.id)
      await campaign.delete()

      return response.ok({ message: 'Engagement campaign deleted successfully' })
    } catch (error) {
      Logger.error('Delete engagement campaign error: %o', error)
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ error: { message: 'Engagement campaign not found' } })
      }
      return response.badRequest({
        error: { message: error.message || 'Failed to delete campaign' }
      })
    }
  }
}
