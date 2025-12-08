import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import MatchingService from 'App/Services/MatchingService'

export default class DiscoveryController {
  private matchingService: MatchingService

  constructor() {
    this.matchingService = new MatchingService()
  }

  public async recommended({ auth, response }: HttpContextContract) {
    const user = auth.user
    if (!user) {
        return response.unauthorized('Must be logged in to get recommendations')
    }

    try {
        const recommendations = await this.matchingService.getRecommendedOpportunities(user)
        return response.ok(recommendations)
    } catch (error) {
        console.error(error)
        return response.internalServerError('Failed to generate recommendations')
    }
  }
}
