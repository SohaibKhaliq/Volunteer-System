import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import VolunteerHour from 'App/Models/VolunteerHour'
import Organization from 'App/Models/Organization'
import CentrelinkService from 'App/Services/CentrelinkService'
import { DateTime } from 'luxon'
import Logger from '@ioc:Adonis/Core/Logger'

export default class CentrelinkController {
  /**
   * Get current fortnight for a user
   */
  public async getCurrentFortnight({ params, response, auth }: HttpContextContract) {
    await auth.use('api').authenticate()
    const currentUser = auth.user!

    // Only allow users to view their own fortnight or admins
    if (currentUser.id !== parseInt(params.userId) && !currentUser.isAdmin) {
      return response.unauthorized({
        message: 'You can only view your own Centrelink fortnight'
      })
    }

    const user = await User.find(params.userId)
    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    // Use user's created date as Centrelink start date (or a specific field if available)
    const startDate = user.createdAt.toJSDate()
    const fortnight = CentrelinkService.getCurrentFortnight(startDate)

    // Get hours for this fortnight
    const hours = await VolunteerHour.query()
      .where('user_id', user.id)
      .where('date', '>=', fortnight.start)
      .where('date', '<=', fortnight.end)
      .orderBy('date', 'asc')

    const hoursData = hours.map((h) => ({
      date: h.date.toJSDate(),
      hours: h.hours,
      approved: h.status === 'approved'
    }))

    const summary = CentrelinkService.calculateFortnightHours(
      hoursData,
      fortnight.start,
      fortnight.end
    )

    return response.ok({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      },
      fortnight: {
        ...fortnight,
        formatted: CentrelinkService.formatFortnightPeriod(
          fortnight.start,
          fortnight.end,
          fortnight.period
        )
      },
      summary,
      hours: hoursData
    })
  }

  /**
   * Generate SU462 form data for a user and fortnight
   */
  public async generateSU462({ params, request, response, auth }: HttpContextContract) {
    await auth.use('api').authenticate()
    const currentUser = auth.user!

    // Only allow users to generate their own SU462 or admins/org managers
    if (currentUser.id !== parseInt(params.userId) && !currentUser.isAdmin) {
      return response.unauthorized({
        message: 'You can only generate your own SU462 report'
      })
    }

    const user = await User.find(params.userId)
    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    // Get fortnight parameters from query
    const { period } = request.qs()
    const startDate = user.createdAt.toJSDate()

    let fortnight
    if (period) {
      // Get specific fortnight by period number
      const fortnights = CentrelinkService.calculateFortnights(
        startDate,
        DateTime.now().toJSDate()
      )
      fortnight = fortnights.find((f) => f.period === parseInt(period))

      if (!fortnight) {
        return response.notFound({ message: 'Fortnight period not found' })
      }
    } else {
      // Get current fortnight
      fortnight = CentrelinkService.getCurrentFortnight(startDate)
    }

    // Get approved hours for this fortnight
    const hours = await VolunteerHour.query()
      .where('user_id', user.id)
      .where('status', 'approved')
      .where('date', '>=', fortnight.start)
      .where('date', '<=', fortnight.end)
      .preload('opportunity', (opportunityQuery) => {
        opportunityQuery.preload('organization')
      })
      .orderBy('date', 'asc')

    if (hours.length === 0) {
      return response.notFound({
        message: 'No approved volunteer hours found for this fortnight'
      })
    }

    // Get organization details from first hour entry
    const firstHour = hours[0]
    const organization = firstHour.opportunity?.organization

    if (!organization) {
      return response.badRequest({
        message: 'Organization information not found for volunteer hours'
      })
    }

    // Prepare activities
    const activities = hours.map((h) => ({
      date: h.date.toJSDate(),
      description: h.opportunity?.title || h.notes || 'Volunteer activity',
      hours: h.hours
    }))

    const totalHours = hours.reduce((sum, h) => sum + h.hours, 0)

    // Generate SU462 data
    const su462Data = CentrelinkService.generateSU462Data({
      organization: {
        name: organization.name,
        abn: organization.abn || 'Not provided',
        address: organization.address || 'Not provided',
        phone: organization.phone || 'Not provided',
        supervisorName: organization.contactName || 'Administrator',
        supervisorEmail: organization.contactEmail || organization.email || 'Not provided',
        supervisorPhone: organization.contactPhone || organization.phone || 'Not provided'
      },
      volunteer: {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        dateOfBirth: user.dateOfBirth?.toJSDate(),
        customerReferenceNumber: (user as any).centrelinkCRN || null
      },
      fortnight: {
        start: fortnight.start,
        end: fortnight.end,
        period: fortnight.period
      },
      hours: totalHours,
      activities
    })

    return response.ok(su462Data)
  }

  /**
   * Export SU462 as CSV
   */
  public async exportSU462CSV({ params, request, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const currentUser = auth.user!

      // Only allow users to export their own SU462 or admins/org managers
      if (currentUser.id !== parseInt(params.userId) && !currentUser.isAdmin) {
        return response.unauthorized({
          message: 'You can only export your own SU462 report'
        })
      }

      // Get SU462 data (reuse the generate endpoint logic)
      const user = await User.find(params.userId)
      if (!user) {
        return response.notFound({ message: 'User not found' })
      }

      const { period } = request.qs()
      const startDate = user.createdAt.toJSDate()

      let fortnight
      if (period) {
        const fortnights = CentrelinkService.calculateFortnights(
          startDate,
          DateTime.now().toJSDate()
        )
        fortnight = fortnights.find((f) => f.period === parseInt(period))
        if (!fortnight) {
          return response.notFound({ message: 'Fortnight period not found' })
        }
      } else {
        fortnight = CentrelinkService.getCurrentFortnight(startDate)
      }

      const hours = await VolunteerHour.query()
        .where('user_id', user.id)
        .where('status', 'approved')
        .where('date', '>=', fortnight.start)
        .where('date', '<=', fortnight.end)
        .preload('opportunity', (opportunityQuery) => {
          opportunityQuery.preload('organization')
        })
        .orderBy('date', 'asc')

      if (hours.length === 0) {
        return response.notFound({
          message: 'No approved volunteer hours found for this fortnight'
        })
      }

      const firstHour = hours[0]
      const organization = firstHour.opportunity?.organization

      if (!organization) {
        return response.badRequest({
          message: 'Organization information not found'
        })
      }

      const activities = hours.map((h) => ({
        date: h.date.toJSDate(),
        description: h.opportunity?.title || h.notes || 'Volunteer activity',
        hours: h.hours
      }))

      const totalHours = hours.reduce((sum, h) => sum + h.hours, 0)

      const su462Data = CentrelinkService.generateSU462Data({
        organization: {
          name: organization.name,
          abn: organization.abn || 'Not provided',
          address: organization.address || 'Not provided',
          phone: organization.phone || 'Not provided',
          supervisorName: organization.contactName || 'Administrator',
          supervisorEmail: organization.contactEmail || organization.email || 'Not provided',
          supervisorPhone: organization.contactPhone || organization.phone || 'Not provided'
        },
        volunteer: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          dateOfBirth: user.dateOfBirth?.toJSDate(),
          customerReferenceNumber: (user as any).centrelinkCRN || null
        },
        fortnight: {
          start: fortnight.start,
          end: fortnight.end,
          period: fortnight.period
        },
        hours: totalHours,
        activities
      })

      // Generate CSV
      const csv = CentrelinkService.generateSU462CSV(su462Data)

      // Set headers for file download
      response.header('Content-Type', 'text/csv')
      response.header(
        'Content-Disposition',
        `attachment; filename="SU462_${user.lastName}_Fortnight${fortnight.period}.csv"`
      )

      return response.send(csv)
    } catch (error) {
      Logger.error('Error generating SU462 CSV:', error)
      return response.status(500).send({
        error: 'Failed to generate SU462 CSV',
        message: error.message
      })
    }
  }
}
