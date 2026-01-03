import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UpdateProfileValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    firstName: schema.string.optional({ trim: true }, [rules.maxLength(255)]),
    lastName: schema.string.optional({ trim: true }, [rules.maxLength(255)]),
    phone: schema.string.optional({ trim: true }, [rules.mobile()]),
    profileMetadata: schema.object.optional().members({
      bio: schema.string.optional({ trim: true }, [rules.maxLength(1000)]),
      address: schema.string.optional({ trim: true }, [rules.maxLength(500)]),
      skills: schema.array.optional().members(schema.string()),
      interests: schema.array.optional().members(schema.string()),
      availability: schema.string.optional({ trim: true }, [rules.maxLength(500)])
    })
  })

  public messages: CustomMessages = {
    'phone.mobile': 'Please provide a valid mobile phone number'
  }
}
