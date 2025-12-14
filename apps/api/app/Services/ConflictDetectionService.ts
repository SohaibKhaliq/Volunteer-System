import { DateTime } from 'luxon'
import Shift from 'App/Models/Shift'
import ShiftAssignment from 'App/Models/ShiftAssignment'
import Application from 'App/Models/Application'
import Opportunity from 'App/Models/Opportunity'
import Attendance from 'App/Models/Attendance'

/**
 * Shift Conflict Detection Service
 * Prevents volunteers from being assigned to overlapping shifts
 */
export default class ConflictDetectionService {
  /**
   * Check if two time periods overlap
   */
  public static doPeriodsOverlap(
    start1: DateTime,
    end1: DateTime,
    start2: DateTime,
    end2: DateTime
  ): boolean {
    // Periods overlap if:
    // start1 < end2 AND end1 > start2
    return start1 < end2 && end1 > start2
  }

  /**
   * Get all shift assignments for a user in a date range
   */
  public static async getUserShiftAssignments(
    userId: number,
    startDate: DateTime,
    endDate: DateTime
  ): Promise<ShiftAssignment[]> {
    const assignments = await ShiftAssignment.query()
      .where('user_id', userId)
      .whereHas('shift', (shiftQuery) => {
        shiftQuery.where('start_at', '<', endDate.toSQL()).where('end_at', '>', startDate.toSQL())
      })
      .preload('shift')

    return assignments
  }

  /**
   * Get all opportunity applications for a user in a date range
   */
  public static async getUserOpportunityCommitments(
    userId: number,
    startDate: DateTime,
    endDate: DateTime
  ): Promise<Application[]> {
    const applications = await Application.query()
      .where('user_id', userId)
      .where('status', 'accepted')
      .whereHas('opportunity', (oppQuery) => {
        oppQuery
          .where('start_date', '<', endDate.toSQL())
          .where('end_date', '>', startDate.toSQL())
      })
      .preload('opportunity')

    return applications
  }

  /**
   * Get all attendances for a user in a date range (checked in but not checked out)
   */
  public static async getUserActiveAttendances(
    userId: number,
    startDate: DateTime,
    endDate: DateTime
  ): Promise<Attendance[]> {
    const attendances = await Attendance.query()
      .where('user_id', userId)
      .whereNull('check_out_at')
      .where('check_in_at', '<', endDate.toSQL())
      .where('check_in_at', '>', startDate.toSQL())

    return attendances
  }

  /**
   * Check for conflicts when assigning a user to a shift
   */
  public static async checkShiftConflicts(
    userId: number,
    shiftStartAt: DateTime,
    shiftEndAt: DateTime
  ): Promise<{
    hasConflict: boolean
    conflicts: Array<{
      type: 'shift' | 'opportunity' | 'attendance'
      id: number
      title: string
      startAt: DateTime
      endAt: DateTime
    }>
  }> {
    const conflicts: Array<{
      type: 'shift' | 'opportunity' | 'attendance'
      id: number
      title: string
      startAt: DateTime
      endAt: DateTime
    }> = []

    // Check shift assignments
    const shiftAssignments = await this.getUserShiftAssignments(
      userId,
      shiftStartAt,
      shiftEndAt
    )

    for (const assignment of shiftAssignments) {
      if (assignment.shift) {
        if (
          this.doPeriodsOverlap(
            shiftStartAt,
            shiftEndAt,
            assignment.shift.startAt,
            assignment.shift.endAt
          )
        ) {
          conflicts.push({
            type: 'shift',
            id: assignment.shift.id,
            title: assignment.shift.title,
            startAt: assignment.shift.startAt,
            endAt: assignment.shift.endAt
          })
        }
      }
    }

    // Check opportunity commitments
    const opportunities = await this.getUserOpportunityCommitments(
      userId,
      shiftStartAt,
      shiftEndAt
    )

    for (const application of opportunities) {
      if (application.opportunity) {
        const opp = application.opportunity
        // Opportunities might span multiple days, so we need to check overlap
        const oppStart = opp.startDate
          ? DateTime.fromJSDate(opp.startDate)
          : shiftStartAt
        const oppEnd = opp.endDate ? DateTime.fromJSDate(opp.endDate) : shiftEndAt

        if (this.doPeriodsOverlap(shiftStartAt, shiftEndAt, oppStart, oppEnd)) {
          conflicts.push({
            type: 'opportunity',
            id: opp.id,
            title: opp.title,
            startAt: oppStart,
            endAt: oppEnd
          })
        }
      }
    }

    // Check active attendances
    const attendances = await this.getUserActiveAttendances(userId, shiftStartAt, shiftEndAt)

    for (const attendance of attendances) {
      const checkInTime = attendance.checkInAt
      // Assume active attendance spans 4 hours if no check-out
      const estimatedEndTime = checkInTime.plus({ hours: 4 })

      if (this.doPeriodsOverlap(shiftStartAt, shiftEndAt, checkInTime, estimatedEndTime)) {
        conflicts.push({
          type: 'attendance',
          id: attendance.id,
          title: 'Active check-in',
          startAt: checkInTime,
          endAt: estimatedEndTime
        })
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    }
  }

  /**
   * Check for conflicts when applying to an opportunity
   */
  public static async checkOpportunityConflicts(
    userId: number,
    opportunityStartDate: Date,
    opportunityEndDate: Date
  ): Promise<{
    hasConflict: boolean
    conflicts: Array<{
      type: 'shift' | 'opportunity' | 'attendance'
      id: number
      title: string
      startAt: DateTime
      endAt: DateTime
    }>
  }> {
    const startDate = DateTime.fromJSDate(opportunityStartDate)
    const endDate = DateTime.fromJSDate(opportunityEndDate)

    return await this.checkShiftConflicts(userId, startDate, endDate)
  }

  /**
   * Format conflict message for display
   */
  public static formatConflictMessage(conflicts: Array<{
    type: string
    title: string
    startAt: DateTime
    endAt: DateTime
  }>): string {
    if (conflicts.length === 0) {
      return 'No conflicts detected'
    }

    const messages = conflicts.map((conflict) => {
      const startStr = conflict.startAt.toFormat('dd LLL yyyy HH:mm')
      const endStr = conflict.endAt.toFormat('HH:mm')
      return `${conflict.title} (${startStr} - ${endStr})`
    })

    if (conflicts.length === 1) {
      return `Conflict with: ${messages[0]}`
    }

    return `Conflicts with: ${messages.join(', ')}`
  }

  /**
   * Check if a user is available during a specific time period
   */
  public static async isUserAvailable(
    userId: number,
    startAt: DateTime,
    endAt: DateTime
  ): Promise<boolean> {
    const result = await this.checkShiftConflicts(userId, startAt, endAt)
    return !result.hasConflict
  }

  /**
   * Get all available users for a shift (no conflicts)
   */
  public static async getAvailableUsers(
    shiftStartAt: DateTime,
    shiftEndAt: DateTime,
    userIds?: number[]
  ): Promise<number[]> {
    const availableUsers: number[] = []

    // If specific user IDs provided, check only those
    // Otherwise, this would be too expensive for large user bases
    if (!userIds || userIds.length === 0) {
      return availableUsers
    }

    for (const userId of userIds) {
      const isAvailable = await this.isUserAvailable(userId, shiftStartAt, shiftEndAt)
      if (isAvailable) {
        availableUsers.push(userId)
      }
    }

    return availableUsers
  }
}
