import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Organization from 'App/Models/Organization'
import Opportunity from 'App/Models/Opportunity'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class PublicOrganizationController {
  /**
   * Get public organization page by slug
   */
  public async show({ params, response }: HttpContextContract) {
    const { slug } = params

    const org = await Organization.query()
      .where('slug', slug)
      .where('status', 'active')
      .where('publicProfile', true)
      .first()

    if (!org) {
      return response.notFound({ message: 'Organization not found or not public' })
    }

    // Get logo URLs
    const logoUrls = await org.resolveLogoUrls()

    // Get basic stats
    const volunteerCount = await Database.from('organization_volunteers')
      .where('organization_id', org.id)
      .where('status', 'Active')
      .count('* as total')

    const eventCount = await Database.from('events')
      .where('organization_id', org.id)
      .count('* as total')

    const totalHoursResult = await Database.from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .where('organization_volunteers.organization_id', org.id)
      .where('volunteer_hours.status', 'approved')
      .sum('volunteer_hours.hours as total')

    return response.ok({
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logo: logoUrls.logo,
      logo_thumb: logoUrls.logo_thumb,
      website: org.website,
      city: org.city,
      country: org.country,
      type: org.type,
      stats: {
        volunteers: volunteerCount[0]?.total || 0,
        events: eventCount[0]?.total || 0,
        totalHours: Math.round(totalHoursResult[0]?.total || 0)
      }
    })
  }

  /**
   * List public organizations
   */
  public async index({ request, response }: HttpContextContract) {
    const { page = 1, limit = 12, search, city, country, type } = request.qs()

    let query = Organization.query().where('status', 'active').where('publicProfile', true)

    if (search) {
      query = query.where((builder) => {
        builder.where('name', 'like', `%${search}%`).orWhere('description', 'like', `%${search}%`)
      })
    }

    if (city) {
      query = query.where('city', city)
    }

    if (country) {
      query = query.where('country', country)
    }

    if (type) {
      query = query.where('type', type)
    }

    const orgs = await query.orderBy('name', 'asc').paginate(page, limit)

    // Resolve logos for each org
    const orgsWithLogos = await Promise.all(
      orgs.all().map(async (org) => {
        const logoUrls = await org.resolveLogoUrls()
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          description: org.description?.substring(0, 200),
          logo: logoUrls.logo,
          logo_thumb: logoUrls.logo_thumb,
          city: org.city,
          country: org.country,
          type: org.type
        }
      })
    )

    return response.ok({
      data: orgsWithLogos,
      meta: orgs.getMeta()
    })
  }

  /**
   * Get public opportunities for an organization
   */
  public async opportunities({ params, request, response }: HttpContextContract) {
    const { slug } = params
    const { page = 1, limit = 10, upcoming = 'true' } = request.qs()

    const org = await Organization.query()
      .where('slug', slug)
      .where('status', 'active')
      .where('publicProfile', true)
      .first()

    if (!org) {
      return response.notFound({ message: 'Organization not found or not public' })
    }

    let query = Opportunity.query()
      .where('organization_id', org.id)
      .where('status', 'published')
      .where('visibility', 'public')
      .preload('team')

    if (upcoming === 'true') {
      query = query.where('start_at', '>=', DateTime.now().toSQL())
    }

    const opportunities = await query.orderBy('start_at', 'asc').paginate(page, limit)

    return response.ok({
      data: opportunities.all().map((opp) => ({
        id: opp.id,
        title: opp.title,
        slug: opp.slug,
        description: opp.description?.substring(0, 300),
        location: opp.location,
        capacity: opp.capacity,
        type: opp.type,
        startAt: opp.startAt,
        endAt: opp.endAt,
        team: opp.team ? { id: opp.team.id, name: opp.team.name } : null
      })),
      meta: opportunities.getMeta()
    })
  }

  /**
   * Get a single public opportunity
   */
  public async opportunity({ params, response }: HttpContextContract) {
    const { slug, opportunityId } = params

    const org = await Organization.query()
      .where('slug', slug)
      .where('status', 'active')
      .where('publicProfile', true)
      .first()

    if (!org) {
      return response.notFound({ message: 'Organization not found or not public' })
    }

    const opportunity = await Opportunity.query()
      .where('id', opportunityId)
      .where('organization_id', org.id)
      .where('status', 'published')
      .where('visibility', 'public')
      .preload('team')
      .first()

    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    // Get application count
    const applicationCount = await Database.from('applications')
      .where('opportunity_id', opportunity.id)
      .where('status', 'accepted')
      .count('* as total')

    const spotsLeft = Math.max(0, opportunity.capacity - (applicationCount[0]?.total || 0))

    return response.ok({
      id: opportunity.id,
      title: opportunity.title,
      slug: opportunity.slug,
      description: opportunity.description,
      location: opportunity.location,
      capacity: opportunity.capacity,
      spotsLeft,
      type: opportunity.type,
      startAt: opportunity.startAt,
      endAt: opportunity.endAt,
      team: opportunity.team ? { id: opportunity.team.id, name: opportunity.team.name } : null,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug
      }
    })
  }

  /**
   * Get list of cities with public organizations
   */
  public async cities({ response }: HttpContextContract) {
    const cities = await Database.from('organizations')
      .where('status', 'active')
      .where('public_profile', true)
      .whereNotNull('city')
      .select('city')
      .distinct('city')
      .orderBy('city')

    return response.ok(cities.map((c) => c.city))
  }

  /**
   * Get list of countries with public organizations
   */
  public async countries({ response }: HttpContextContract) {
    const countries = await Database.from('organizations')
      .where('status', 'active')
      .where('public_profile', true)
      .whereNotNull('country')
      .select('country')
      .distinct('country')
      .orderBy('country')

    return response.ok(countries.map((c) => c.country))
  }

  /**
   * Get list of organization types
   */
  public async types({ response }: HttpContextContract) {
    const types = await Database.from('organizations')
      .where('status', 'active')
      .where('public_profile', true)
      .whereNotNull('type')
      .select('type')
      .distinct('type')
      .orderBy('type')

    return response.ok(types.map((t) => t.type))
  }
}
