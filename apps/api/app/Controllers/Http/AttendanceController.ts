import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Assignment from 'App/Models/Assignment'
import Event from 'App/Models/Event'
import Task from 'App/Models/Task'
import { DateTime } from 'luxon'

export default class AttendanceController {
  // Generate a QR code payload (this would be returned to frontend to render the QR)
  // In reality, frontend just needs the event/task ID, but we might want to sign it.
  public async generateQr({ params, response }: HttpContextContract) {
    // For simplicity, we just return the ID. A more secure version would sign this payload.
    // The frontend will render a QR code containing:
    // {"type": "event_check_in", "id": 123, "timestamp": ...}

    // Check if event exists
    const event = await Event.find(params.eventId)
    if (!event) return response.notFound({ message: 'Event not found' })

    const payload = {
      action: 'check-in',
      eventId: event.id,
      generatedAt: DateTime.now().toISO()
    }

    return response.ok(payload)
  }

  // Volunteer scans QR code -> Frontend sends request to this endpoint
  public async checkIn({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const { eventId, latitude, longitude } = request.all()

    // 1. Verify User has an approved assignment for this event (or a task in this event)
    // Find tasks for this event
    const tasks = await Task.query().where('event_id', eventId).select('id')
    const taskIds = tasks.map(t => t.id)

    // Find assignment
    const assignment = await Assignment.query()
      .where('user_id', user.id)
      .whereIn('task_id', taskIds)
      .where('status', 'approved')
      .first()

    if (!assignment) {
      return response.badRequest({ message: 'You do not have an approved shift for this event.' })
    }

    // 2. Geo-verification (Optional logic stub)
    if (latitude && longitude) {
      // Calculate distance to event.location (if coordinates stored)
      // For now, we assume passed.
    }

    // 3. Update Assignment
    assignment.checkInTime = DateTime.now()
    assignment.attendanceVerified = true
    assignment.status = 'checked_in' // Update status
    await assignment.save()

    return response.ok({ message: 'Check-in successful', assignment })
  }

  public async checkOut({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const { eventId } = request.all()

     // Find tasks for this event
     const tasks = await Task.query().where('event_id', eventId).select('id')
     const taskIds = tasks.map(t => t.id)

     // Find assignment that is checked in
     const assignment = await Assignment.query()
       .where('user_id', user.id)
       .whereIn('task_id', taskIds)
       .where('status', 'checked_in')
       .first()

     if (!assignment) {
       return response.badRequest({ message: 'No active check-in found for this event.' })
     }

     assignment.checkOutTime = DateTime.now()
     assignment.status = 'attended' // Final status
     await assignment.save()

     // Trigger VolunteerHour calculation here or via a hook/cron
     // For immediate gratification:
     const VolunteerHour = (await import('App/Models/VolunteerHour')).default

     // Calculate duration in hours
     const duration = assignment.checkOutTime.diff(assignment.checkInTime!, 'hours').hours

     await VolunteerHour.create({
        userId: user.id,
        organizationId: (await Event.find(eventId))?.organizationId,
        hoursLogged: Math.max(0.1, duration), // Ensure at least some credit
        verified: true
     })

     return response.ok({ message: 'Check-out successful. Hours logged.', hours: duration })
  }
}
