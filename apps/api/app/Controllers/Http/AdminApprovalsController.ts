import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import HelpRequest from 'App/Models/HelpRequest'
import Offer from 'App/Models/Offer'
import CarpoolingAd from 'App/Models/CarpoolingAd'

const entityMap: Record<string, any> = {
  help_requests: HelpRequest,
  offers: Offer,
  carpooling_ads: CarpoolingAd
}

export default class AdminApprovalsController {
  private getModel(entity: string) {
    return entityMap[entity]
  }

  public async index({ params, request, response }: HttpContextContract) {
    try {
      const { entity } = params
      const Model = this.getModel(entity)
      if (!Model) return response.badRequest({ message: 'Unknown entity' })

      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)

      const pending = await Model.query()
        .where('approval_status', 'pending')
        .orderBy('created_at', 'desc')
        .paginate(page, perPage)

      return pending
    } catch (error) {
      return response.badRequest({
        message: 'Failed to list pending approvals',
        error: error.message
      })
    }
  }

  public async approve({ params, request, response }: HttpContextContract) {
    try {
      const { entity, id } = params
      const Model = this.getModel(entity)
      if (!Model) return response.badRequest({ message: 'Unknown entity' })

      const record = await Model.findOrFail(id)

      // Only pending items can be approved
      if (record.approvalStatus && record.approvalStatus !== 'pending') {
        return response.badRequest({
          message: `Cannot approve item with status '${record.approvalStatus}'`
        })
      }

      const userId = request.auth && request.auth.user ? request.auth.user.id : null
      record.approvalStatus = 'approved'
      if (userId) record.approvedBy = userId
      record.approvedAt = DateTime.local()

      await record.save()
      return record
    } catch (error) {
      console.error('Admin Approvals: approve error', error)
      return response.internalServerError({
        message: 'Failed to approve',
        error: error?.message ?? String(error)
      })
    }
  }

  public async reject({ params, request, response }: HttpContextContract) {
    try {
      const { entity, id } = params
      const Model = this.getModel(entity)
      if (!Model) return response.badRequest({ message: 'Unknown entity' })

      const record = await Model.findOrFail(id)

      // Only pending items can be rejected
      if (record.approvalStatus && record.approvalStatus !== 'pending') {
        return response.badRequest({
          message: `Cannot reject item with status '${record.approvalStatus}'`
        })
      }

      const userId = request.auth && request.auth.user ? request.auth.user.id : null
      record.approvalStatus = 'rejected'
      if (userId) record.approvedBy = userId
      record.approvedAt = DateTime.local()

      await record.save()
      return record
    } catch (error) {
      console.error('Admin Approvals: reject error', error)
      return response.internalServerError({
        message: 'Failed to reject',
        error: error?.message ?? String(error)
      })
    }
  }
}
