import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import Attendance from 'App/Models/Attendance'
import Opportunity from 'App/Models/Opportunity'
import Application from 'App/Models/Application'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import VolunteerHour from 'App/Models/VolunteerHour'
import Notification from 'App/Models/Notification'
import Event from 'App/Models/Event'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'
import GeolocationService from 'App/Services/GeolocationService'
import Logger from '@ioc:Adonis/Core/Logger'

// Placeholder event ID used when opportunities are not yet linked to events
// TODO: Implement opportunity-event linking and use actual event IDs
const PLACEHOLDER_EVENT_ID = 0

export default class AttendancesController {
  /**
   * Check in to an opportunity with geolocation validation
   */
  public async checkIn({ params, request, response, auth }: HttpContextContract) {
    const { id: opportunityId } = params
    const user = auth.user!

    const opportunity = await Opportunity.find(opportunityId)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    // Check if user has an accepted application
    const application = await Application.query()
      .where('opportunity_id', opportunityId)
      .where('user_id', user.id)
      .where('status', 'accepted')
      .first()

    if (!application) {
      return response.forbidden({
        message: 'You must have an accepted application to check in'
      })
    }

    // --- Compliance Check ---
    const ComplianceRequirement = (await import('App/Models/ComplianceRequirement')).default
    const ComplianceDocument = (await import('App/Models/ComplianceDocument')).default

    const requirements = await ComplianceRequirement.query()
      .where('organization_id', opportunity.organizationId)
      .andWhere((q) => {
        q.whereNull('opportunity_id').orWhere('opportunity_id', opportunity.id)
      })
      .andWhere('is_mandatory', true)
      .andWhereIn('enforcement_level', ['onboarding', 'signup', 'checkin'])

    if (requirements.length > 0) {
      const docTypes = requirements.map((r) => r.docType)
      const userDocs = await ComplianceDocument.query()
        .where('user_id', user.id)
        .whereIn('doc_type', docTypes)
        .where('status', 'Valid')
        .where((q) => {
          q.whereNull('expires_at').orWhere('expires_at', '>', DateTime.now().toSQL())
        })

      const validDocTypes = new Set(userDocs.map((d) => d.docType))
      const missingRequirements = requirements.filter((r) => !validDocTypes.has(r.docType))

      if (missingRequirements.length > 0) {
        return response.forbidden({
          message: 'You do not meet the compliance requirements to check in.',
          requirements: missingRequirements.map((r) => ({ name: r.name, docType: r.docType }))
        })
      }
    }
    // --- End Compliance Check ---

    // Check if already checked in
    const existingCheckin = await Attendance.query()
      .where('opportunity_id', opportunityId)
      .where('user_id', user.id)
      .whereNull('check_out_at')
      .first()

    if (existingCheckin) {
      return response.conflict({ message: 'You are already checked in' })
    }

    const { method, metadata, latitude, longitude, accuracy, exceptionReason } = request.only([
      'method',
      'metadata',
      'latitude',
      'longitude',
      'accuracy',
      'exceptionReason'
    ])

    // Geolocation validation
    let geolocationData: any = null
    let geolocationValid = false

    if (latitude !== undefined && longitude !== undefined) {
      // Validate coordinates format
      const coordValidation = GeolocationService.validateCoordinates(latitude, longitude)

      if (!coordValidation.valid) {
        return response.badRequest({
          message: coordValidation.message
        })
      }

      // Create geolocation metadata
      geolocationData = GeolocationService.createGeolocationMetadata(
        latitude,
        longitude,
        accuracy,
        new Date()
      )

      // Check if opportunity has location
      if (opportunity.latitude && opportunity.longitude) {
        const proximityCheck = GeolocationService.isWithinRadius(
          latitude,
          longitude,
          opportunity.latitude,
          opportunity.longitude,
          200 // 200m radius for Australian workplace safety
        )

        geolocationData.proximityCheck = proximityCheck
        geolocationValid = proximityCheck.within

        // If outside radius, require exception reason
        if (!proximityCheck.within && !exceptionReason) {
          return response.status(422).send({
            message: 'You are outside the shift location radius',
            error: proximityCheck.message,
            distance: proximityCheck.distance,
            requiresException: true
          })
        }

        if (!proximityCheck.within && exceptionReason) {
          geolocationData.exceptionReason = exceptionReason
          geolocationData.exceptionGranted = true
          Logger.info(
            `Geolocation exception granted for user ${user.id} at opportunity ${opportunityId}: ${exceptionReason}`
          )
        }
      } else {
        // No opportunity location set, log warning
        Logger.warn(`Opportunity ${opportunityId} has no location set for geolocation validation`)
        geolocationData.warning = 'Opportunity location not configured'
      }
    }

    const attendance = await Attendance.create({
      opportunityId: parseInt(opportunityId),
      userId: user.id,
      checkInAt: DateTime.now(),
      method: method || 'manual',
      metadata: {
        ...(metadata || {}),
        geolocation: geolocationData,
        geolocationValid
      }
    })

    await attendance.load('user')
    await attendance.load('opportunity')

    // Send real-time notification to organization team members
    try {
      const orgTeamMembers = await OrganizationTeamMember.query()
        .where('organization_id', opportunity.organizationId)
        .select('user_id')

      // Create notifications in parallel for better performance
      await Promise.all(
        orgTeamMembers.map((member) =>
          Notification.create({
            userId: member.userId,
            type: 'volunteer_checked_in',
            payload: JSON.stringify({
              attendanceId: attendance.id,
              opportunityId: opportunity.id,
              opportunityTitle: opportunity.title,
              volunteerId: user.id,
              volunteerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
              geolocationValid,
              distance: geolocationData?.proximityCheck?.distance
            })
          })
        )
      )
    } catch (err) {
      console.warn('Failed to send check-in notification:', err)
    }

    return response.created({
      message: 'Checked in successfully',
      attendance,
      geolocationValid
    })
  }

  /**
   * Check out from an opportunity
   */
  public async checkOut({ params, response, auth }: HttpContextContract) {
    const { id: opportunityId } = params
    const user = auth.user!

    // Find active check-in
    const attendance = await Attendance.query()
      .where('opportunity_id', opportunityId)
      .where('user_id', user.id)
      .whereNull('check_out_at')
      .first()

    if (!attendance) {
      return response.notFound({ message: 'No active check-in found' })
    }

    await attendance.checkOut()
    await attendance.load('user')
    await attendance.load('opportunity')

    const duration = attendance.getDurationHours()

    // Create volunteer hours record (pending approval)
    let volunteerHour: VolunteerHour | null = null
    if (duration && duration > 0) {
      try {
        volunteerHour = await VolunteerHour.create({
          userId: user.id,
          eventId: PLACEHOLDER_EVENT_ID,
          date: attendance.checkInAt!.toJSDate(),
          hours: duration,
          status: 'Pending'
        })

        // Send notification to organization team members about pending hours
        const opportunity = attendance.opportunity || (await Opportunity.find(opportunityId))
        if (opportunity && volunteerHour) {
          // Store volunteerHour in a const to help TypeScript narrow the type
          const createdVolunteerHour = volunteerHour

          const orgTeamMembers = await OrganizationTeamMember.query()
            .where('organization_id', opportunity.organizationId)
            .select('user_id')

          // Create notifications in parallel for better performance
          await Promise.all(
            orgTeamMembers.map((member) =>
              Notification.create({
                userId: member.userId,
                type: 'hours_pending_approval',
                payload: JSON.stringify({
                  volunteerHourId: createdVolunteerHour.id,
                  opportunityId: opportunity.id,
                  opportunityTitle: opportunity.title,
                  volunteerId: user.id,
                  volunteerName:
                    `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                  hours: duration
                })
              })
            )
          )
        }
      } catch (err) {
        console.warn('Failed to create volunteer hours or send notification:', err)
      }
    }

    return response.ok({
      message: 'Checked out successfully',
      attendance,
      duration_hours: duration,
      volunteer_hour: volunteerHour
    })
  }

  /**
   * Get attendances for an organization
   */
  public async organizationAttendances({ params, request, response }: HttpContextContract) {
    const { organizationId } = params
    const { page = 1, perPage = 20, opportunity_id, user_id, from, to } = request.qs()

    let query = Attendance.query()
      .whereHas('opportunity', (builder: ModelQueryBuilderContract<typeof Opportunity>) => {
        builder.where('organization_id', organizationId)
        if (opportunity_id) {
          builder.where('id', opportunity_id)
        }
      })
      .preload('user')
      .preload('opportunity')
      .orderBy('check_in_at', 'desc')

    if (user_id) {
      query = query.where('user_id', user_id)
    }
    if (from) {
      query = query.where('check_in_at', '>=', from)
    }
    if (to) {
      query = query.where('check_in_at', '<=', to)
    }

    const attendances = await query.paginate(page, perPage)

    return response.ok(attendances)
  }

  /**
   * Get attendances for the current user's organization
   */
  public async myOrganizationAttendances({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const { page = 1, perPage = 20, opportunity_id, user_id, from, to } = request.qs()

    let query = Attendance.query()
      .whereHas('opportunity', (builder: ModelQueryBuilderContract<typeof Opportunity>) => {
        builder.where('organization_id', memberRecord.organizationId)
        if (opportunity_id) {
          builder.where('id', opportunity_id)
        }
      })
      .preload('user')
      .preload('opportunity')
      .orderBy('check_in_at', 'desc')

    if (user_id) {
      query = query.where('user_id', user_id)
    }
    if (from) {
      query = query.where('check_in_at', '>=', from)
    }
    if (to) {
      query = query.where('check_in_at', '<=', to)
    }

    const attendances = await query.paginate(page, perPage)

    return response.ok(attendances)
  }

  /**
   * Get attendances for a specific opportunity
   */
  public async opportunityAttendances({ params, request, response }: HttpContextContract) {
    const { id: opportunityId } = params
    const { page = 1, perPage = 20 } = request.qs()

    const opportunity = await Opportunity.find(opportunityId)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    const attendances = await Attendance.query()
      .where('opportunity_id', opportunityId)
      .preload('user')
      .orderBy('check_in_at', 'desc')
      .paginate(page, perPage)

    return response.ok(attendances)
  }

  /**
   * Manual check-in by admin
   */
  public async manualCheckIn({ params, request, response }: HttpContextContract) {
    const { id: opportunityId } = params
    const { user_id, check_in_at, check_out_at, notes } = request.only([
      'user_id',
      'check_in_at',
      'check_out_at',
      'notes'
    ])

    const opportunity = await Opportunity.find(opportunityId)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    const attendance = await Attendance.create({
      opportunityId: parseInt(opportunityId),
      userId: user_id,
      checkInAt: check_in_at ? DateTime.fromISO(check_in_at) : DateTime.now(),
      checkOutAt: check_out_at ? DateTime.fromISO(check_out_at) : undefined,
      method: 'manual',
      metadata: notes ? { notes } : undefined
    })

    await attendance.load('user')

    return response.created({
      message: 'Attendance recorded successfully',
      attendance
    })
  }

  /**
   * Update attendance record
   */
  public async update({ params, request, response }: HttpContextContract) {
    const attendance = await Attendance.find(params.id)
    if (!attendance) {
      return response.notFound({ message: 'Attendance not found' })
    }

    const { check_in_at, check_out_at, method, metadata } = request.only([
      'check_in_at',
      'check_out_at',
      'method',
      'metadata'
    ])

    if (check_in_at) attendance.checkInAt = DateTime.fromISO(check_in_at)
    if (check_out_at !== undefined) {
      attendance.checkOutAt = check_out_at ? DateTime.fromISO(check_out_at) : undefined
    }
    if (method) attendance.method = method
    if (metadata !== undefined) attendance.metadata = metadata

    await attendance.save()
    await attendance.load('user')

    return response.ok(attendance)
  }

  /**
   * Delete attendance record
   */
  public async destroy({ params, response }: HttpContextContract) {
    const attendance = await Attendance.find(params.id)
    if (!attendance) {
      return response.notFound({ message: 'Attendance not found' })
    }

    await attendance.delete()

    return response.noContent()
  }

  /**
   * Get attendance summary for an opportunity
   */
  public async summary({ params, response }: HttpContextContract) {
    const { id: opportunityId } = params

    const opportunity = await Opportunity.find(opportunityId)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    const stats = await Database.from('attendances')
      .where('opportunity_id', opportunityId)
      .select(
        Database.raw('COUNT(*) as total_attendances'),
        Database.raw('COUNT(DISTINCT user_id) as unique_volunteers'),
        Database.raw(
          'SUM(TIMESTAMPDIFF(HOUR, check_in_at, COALESCE(check_out_at, NOW()))) as total_hours'
        )
      )
      .first()

    return response.ok({
      opportunity_id: opportunityId,
      total_attendances: stats?.total_attendances || 0,
      unique_volunteers: stats?.unique_volunteers || 0,
      total_hours: stats?.total_hours || 0
    })
  }

  /**
   * QR Code check-in - Check in using the opportunity's QR code
   */
  public async qrCheckIn({ request, response, auth }: HttpContextContract) {
    const user = auth.user!
    const { code } = request.only(['code'])

    if (!code) {
      return response.badRequest({ message: 'Check-in code is required' })
    }

    // Find opportunity by check-in code
    const opportunity = await Opportunity.query().where('checkin_code', code).first()

    if (!opportunity) {
      return response.notFound({ message: 'Invalid check-in code' })
    }

    // Check if opportunity is published
    if (opportunity.status !== 'published') {
      return response.badRequest({ message: 'This opportunity is not currently active' })
    }

    // Check if user has an accepted application
    const application = await Application.query()
      .where('opportunity_id', opportunity.id)
      .where('user_id', user.id)
      .where('status', 'accepted')
      .first()

    if (!application) {
      return response.forbidden({
        message: 'You must have an accepted application to check in'
      })
    }

    // --- Compliance Check ---
    const ComplianceRequirement = (await import('App/Models/ComplianceRequirement')).default
    const ComplianceDocument = (await import('App/Models/ComplianceDocument')).default

    // Note: We use opportunity.organizationId, checking if opportunity has it (it should if loaded)
    // If opportunity is partial, we might need to load it.
    // Line 469: `Opportunity.query().where('checkin_code', code).first()`
    // We should ensure organizationId is available. It is a column, so it is.

    const requirements = await ComplianceRequirement.query()
      .where('organization_id', opportunity.organizationId)
      .andWhere((q) => {
        q.whereNull('opportunity_id').orWhere('opportunity_id', opportunity.id)
      })
      .andWhere('is_mandatory', true)
      .andWhereIn('enforcement_level', ['onboarding', 'signup', 'checkin'])

    if (requirements.length > 0) {
      const docTypes = requirements.map((r) => r.docType)
      const userDocs = await ComplianceDocument.query()
        .where('user_id', user.id)
        .whereIn('doc_type', docTypes)
        .where('status', 'Valid')
        .where((q) => {
          q.whereNull('expires_at').orWhere('expires_at', '>', DateTime.now().toSQL())
        })

      const validDocTypes = new Set(userDocs.map((d) => d.docType))
      const missingRequirements = requirements.filter((r) => !validDocTypes.has(r.docType))

      if (missingRequirements.length > 0) {
        return response.forbidden({
          message: 'You do not meet the compliance requirements to check in.',
          requirements: missingRequirements.map((r) => ({ name: r.name, docType: r.docType }))
        })
      }
    }
    // --- End Compliance Check ---

    // Check if already checked in
    const existingCheckin = await Attendance.query()
      .where('opportunity_id', opportunity.id)
      .where('user_id', user.id)
      .whereNull('check_out_at')
      .first()

    if (existingCheckin) {
      return response.conflict({ message: 'You are already checked in to this opportunity' })
    }

    const attendance = await Attendance.create({
      opportunityId: opportunity.id,
      userId: user.id,
      checkInAt: DateTime.now(),
      method: 'qr'
    })

    await attendance.load('user')
    await attendance.load('opportunity')

    return response.created({
      message: 'Checked in successfully via QR code',
      attendance,
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        location: opportunity.location
      }
    })
  }

  /**
   * Generate or regenerate check-in code for an opportunity
   */
  public async generateCheckinCode({ params, response }: HttpContextContract) {
    const { id: opportunityId } = params

    const opportunity = await Opportunity.find(opportunityId)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    // Generate new check-in code
    opportunity.checkinCode = Opportunity.generateCheckinCode()
    await opportunity.save()

    return response.ok({
      message: 'Check-in code generated successfully',
      checkinCode: opportunity.checkinCode,
      qrData: opportunity.getQRData()
    })
  }

  /**
   * Get check-in code for an opportunity
   */
  public async getCheckinCode({ params, response }: HttpContextContract) {
    const { id: opportunityId } = params

    const opportunity = await Opportunity.find(opportunityId)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    // Generate code if not exists
    if (!opportunity.checkinCode) {
      opportunity.checkinCode = Opportunity.generateCheckinCode()
      await opportunity.save()
    }

    return response.ok({
      checkinCode: opportunity.checkinCode,
      qrData: opportunity.getQRData()
    })
  }
}
