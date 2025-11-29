import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateOrganizationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}, [rules.maxLength(255)]),
    description: schema.string.optional({}, [rules.maxLength(2000)]),
    contact_email: schema.string.optional({}, [rules.email(), rules.maxLength(255)]),
    contact_phone: schema.string.optional({}, [rules.maxLength(50)]),
    // file validation for logo
    logo: schema.file.optional({
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp']
    }) as any
  })

  public messages = {
    'name.required': 'Organization name is required',
    'logo.file.extname': 'Logo must be an image (jpg, jpeg, png, webp)',
    'logo.file.size': 'Logo must be under 2MB in size'
  }
}
