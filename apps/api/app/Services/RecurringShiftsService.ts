import { DateTime } from 'luxon'
import Shift from 'App/Models/Shift'
import ShiftAssignment from 'App/Models/ShiftAssignment'

/**
 * Recurring Shifts Service
 * Handles creation and management of recurring shift patterns
 */
export default class RecurringShiftsService {
  /**
   * Parse recurrence rule string into structured format
   * Format: "WEEKLY:MON,WED,FRI" or "MONTHLY:1,15" or "DAILY"
   */
  public static parseRecurrenceRule(rule: string): {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
    days?: number[]
    weekdays?: string[]
  } | null {
    if (!rule) return null

    const parts = rule.split(':')
    const frequency = parts[0] as 'DAILY' | 'WEEKLY' | 'MONTHLY'

    if (frequency === 'DAILY') {
      return { frequency }
    }

    if (frequency === 'WEEKLY' && parts[1]) {
      const weekdays = parts[1].split(',')
      return { frequency, weekdays }
    }

    if (frequency === 'MONTHLY' && parts[1]) {
      const days = parts[1].split(',').map((d) => parseInt(d))
      return { frequency, days }
    }

    return null
  }

  /**
   * Generate occurrences for a recurring shift
   */
  public static generateOccurrences(
    baseShift: {
      startAt: DateTime
      endAt: DateTime
      recurrenceRule?: string
    },
    endDate: DateTime
  ): Array<{ startAt: DateTime; endAt: DateTime }> {
    const occurrences: Array<{ startAt: DateTime; endAt: DateTime }> = []

    if (!baseShift.recurrenceRule) {
      occurrences.push({
        startAt: baseShift.startAt,
        endAt: baseShift.endAt
      })
      return occurrences
    }

    const rule = this.parseRecurrenceRule(baseShift.recurrenceRule)
    if (!rule) {
      occurrences.push({
        startAt: baseShift.startAt,
        endAt: baseShift.endAt
      })
      return occurrences
    }

    const duration = baseShift.endAt.diff(baseShift.startAt)
    let currentDate = baseShift.startAt

    while (currentDate <= endDate) {
      let shouldAdd = false

      switch (rule.frequency) {
        case 'DAILY':
          shouldAdd = true
          break

        case 'WEEKLY':
          if (rule.weekdays) {
            const weekdayMap: Record<string, number> = {
              SUN: 7,
              MON: 1,
              TUE: 2,
              WED: 3,
              THU: 4,
              FRI: 5,
              SAT: 6
            }
            const currentWeekday = currentDate.weekday
            shouldAdd = rule.weekdays.some((day) => weekdayMap[day] === currentWeekday)
          }
          break

        case 'MONTHLY':
          if (rule.days) {
            shouldAdd = rule.days.includes(currentDate.day)
          }
          break
      }

      if (shouldAdd) {
        const startAt = currentDate
        const endAt = currentDate.plus(duration)
        occurrences.push({ startAt, endAt })
      }

      // Move to next occurrence
      switch (rule.frequency) {
        case 'DAILY':
          currentDate = currentDate.plus({ days: 1 })
          break
        case 'WEEKLY':
          currentDate = currentDate.plus({ days: 1 })
          break
        case 'MONTHLY':
          currentDate = currentDate.plus({ days: 1 })
          break
      }
    }

    return occurrences
  }

  /**
   * Create recurring shift instances
   */
  public static async createRecurringShifts(
    templateShift: Partial<Shift>,
    recurrenceRule: string,
    endDate: DateTime
  ): Promise<Shift[]> {
    const baseStart = templateShift.startAt || DateTime.now()
    const baseEnd = templateShift.endAt || DateTime.now().plus({ hours: 2 })

    const occurrences = this.generateOccurrences(
      {
        startAt: baseStart,
        endAt: baseEnd,
        recurrenceRule
      },
      endDate
    )

    const shifts: Shift[] = []

    for (const occurrence of occurrences) {
      const shift = await Shift.create({
        ...templateShift,
        startAt: occurrence.startAt,
        endAt: occurrence.endAt,
        isRecurring: true,
        recurrenceRule,
        templateName: templateShift.templateName || 'Recurring Shift'
      })
      shifts.push(shift)
    }

    return shifts
  }

  /**
   * Update all future occurrences of a recurring shift
   */
  public static async updateFutureOccurrences(
    templateShiftId: number,
    updates: Partial<Shift>
  ): Promise<number> {
    const templateShift = await Shift.find(templateShiftId)
    if (!templateShift || !templateShift.isRecurring) {
      return 0
    }

    // Update all future shifts with the same template name
    const affectedCount = await Shift.query()
      .where('template_name', templateShift.templateName || '')
      .where('start_at', '>=', DateTime.now().toSQL())
      .update(updates)

    return affectedCount
  }

  /**
   * Cancel all future occurrences of a recurring shift
   */
  public static async cancelFutureOccurrences(templateShiftId: number): Promise<number> {
    const templateShift = await Shift.find(templateShiftId)
    if (!templateShift || !templateShift.isRecurring) {
      return 0
    }

    // Delete all future shifts with the same template name
    const affectedCount = await Shift.query()
      .where('template_name', templateShift.templateName || '')
      .where('start_at', '>=', DateTime.now().toSQL())
      .delete()

    return affectedCount
  }

  /**
   * Format recurrence rule for display
   */
  public static formatRecurrenceRule(rule: string): string {
    const parsed = this.parseRecurrenceRule(rule)
    if (!parsed) return 'Custom recurrence'

    switch (parsed.frequency) {
      case 'DAILY':
        return 'Every day'
      case 'WEEKLY':
        if (parsed.weekdays) {
          const dayNames: Record<string, string> = {
            MON: 'Monday',
            TUE: 'Tuesday',
            WED: 'Wednesday',
            THU: 'Thursday',
            FRI: 'Friday',
            SAT: 'Saturday',
            SUN: 'Sunday'
          }
          const days = parsed.weekdays.map((d) => dayNames[d] || d).join(', ')
          return `Every ${days}`
        }
        return 'Weekly'
      case 'MONTHLY':
        if (parsed.days) {
          const days = parsed.days.join(', ')
          return `Monthly on day(s) ${days}`
        }
        return 'Monthly'
      default:
        return 'Custom recurrence'
    }
  }
}
