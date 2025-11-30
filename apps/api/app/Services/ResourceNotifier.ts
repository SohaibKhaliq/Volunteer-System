import ResourceAssignment from 'App/Models/ResourceAssignment'
import Resource from 'App/Models/Resource'
import Notification from 'App/Models/Notification'
import Event from 'App/Models/Event'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'

let _interval: NodeJS.Timeout | null = null

async function checkOverdueAssignments() {
  try {
    const now = DateTime.local().toISO()
    // Find assigned resource assignments that are past expectedReturnAt and still assigned
    const overdue = await ResourceAssignment.query()
      .where('status', 'assigned')
      .whereNotNull('expected_return_at')
      .andWhere('expected_return_at', '<', now)

    for (const a of overdue) {
      try {
        // Notification to assigned user (if relatedId refers to user)
        if (
          a.assignmentType === 'user' ||
          a.assignmentType === 'volunteer' ||
          Number.isInteger(a.relatedId)
        ) {
          await Notification.create({
            userId: a.relatedId as number,
            type: 'resource.assignment.overdue',
            payload: JSON.stringify({ assignmentId: a.id, resourceId: a.resourceId })
          })
        }

        // If assignment relates to an event, notify event organizer
        if (a.assignmentType === 'event' && a.relatedId) {
          const ev = await Event.find(a.relatedId)
          if (ev && ev.organizationId) {
            // notify organizer (best-effort: find organizer user id via organization owner relationship is complex)
            // As a fallback, notify the organization id as userId 0 so admins can surface to org team
            await Notification.create({
              userId: ev.organizationId as any as number,
              type: 'resource.assignment.event.overdue',
              payload: JSON.stringify({
                assignmentId: a.id,
                resourceId: a.resourceId,
                eventId: ev.id
              })
            })
          }
        }
      } catch (e) {
        Logger.warn(`Failed to create overdue notification for assignment ${a.id}: ${String(e)}`)
      }
    }
  } catch (e) {
    Logger.error('Error checking overdue assignments: ' + String(e))
  }
}

async function checkMaintenanceDue() {
  try {
    const now = DateTime.local()
    const soon = now.plus({ days: 1 }).toISO()
    // Find resources where nextMaintenanceAt is set and <= next day
    const due = await Resource.query()
      .whereNotNull('next_maintenance_at')
      .andWhere('next_maintenance_at', '<=', soon)

    for (const r of due) {
      try {
        // notify assigned technician if present
        if (r.assignedTechnicianId) {
          await Notification.create({
            userId: r.assignedTechnicianId,
            type: 'resource.maintenance.due',
            payload: JSON.stringify({ resourceId: r.id })
          })
        }
        // Also create an org-level notification (use organizationId as pseudo-user)
        if (r.organizationId) {
          await Notification.create({
            userId: r.organizationId as any as number,
            type: 'resource.maintenance.due.org',
            payload: JSON.stringify({ resourceId: r.id })
          })
        }
      } catch (e) {
        Logger.warn(`Failed to create maintenance notification for resource ${r.id}: ${String(e)}`)
      }
    }
  } catch (e) {
    Logger.error('Error checking maintenance due: ' + String(e))
  }
}

export function initResourceNotifier() {
  if (_interval) return
  // Run immediately then every 5 minutes
  checkOverdueAssignments()
  checkMaintenanceDue()
  _interval = setInterval(
    () => {
      checkOverdueAssignments()
      checkMaintenanceDue()
    },
    5 * 60 * 1000
  )
}

export function stopResourceNotifier() {
  if (_interval) {
    clearInterval(_interval)
    _interval = null
  }
}
