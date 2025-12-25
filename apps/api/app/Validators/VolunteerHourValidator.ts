import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export class CreateVolunteerHourValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    eventId: schema.number([
      rules.exists({ table: 'events', column: 'id' })
    ]),
    shiftId: schema.number.optional([
      rules.exists({ table: 'shifts', column: 'id' })
    ]),
    date: schema.date({
      format: 'yyyy-MM-dd'
    }),
    hours: schema.number([
      rules.range(0.25, 24)
    ]),
    notes: schema.string.optional({ trim: true })
  })

  public messages = {
    'eventId.required': 'Event is required',
    'hours.range': 'Hours must be between 0.25 and 24'
  }
}

export class UpdateVolunteerHourValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    status: schema.enum.optional(['approved', 'rejected', 'pending']),
    rejectionReason: schema.string.optional({ trim: true }),
    notes: schema.string.optional({ trim: true }),
    hours: schema.number.optional([
      rules.range(0.25, 24)
    ])
  })
}
