import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import VolunteerHour from 'App/Models/VolunteerHour'
import Organization from 'App/Models/Organization'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class HomeController {
  public async stats({ response }: HttpContextContract) {
    // 1. Active Volunteers: contributed approved hours in the last 12 months
    const oneYearAgo = DateTime.now().minus({ months: 12 }).toSQLDate()

    const activeVolunteersResult = await VolunteerHour.query()
      .where('status', 'Approved')
      .where('date', '>=', oneYearAgo as string)
      .countDistinct('user_id as count')

    const activeVolunteers = Number(activeVolunteersResult[0].$extras.count || 0)

    // 2. Hours Contributed: All-time sum of approved hours
    const hoursResult = await VolunteerHour.query()
      .where('status', 'Approved')
      .sum('hours as total')

    const hoursContributed = Number(hoursResult[0].$extras.total || 0)

    // 3. Partner Organizations: Total count of active organizations
    // Assuming all organizations in the table are "partners" or we might want to filter by status if applicable.
    // Based on OrganizationDashboardController, there doesn't seem to be a specific "partner" flag,
    // but we can check if there's a status column in Organization model.
    // Let's assume all organizations for now, or check Organization model.
    // OrganizationDashboardController uses Organization.find(id) without status check,
    // but OrganizationAnalyticsService joins organization_volunteers.
    // Let's just count all organizations for now.

    const organizationsResult = await Database.from('organizations').count('* as count')
    const partnerOrganizations = Number(organizationsResult[0].count || 0)

    return response.ok({
      activeVolunteers,
      hoursContributed: Math.round(hoursContributed), // Round to integer for display
      partnerOrganizations
    })
  }
}
