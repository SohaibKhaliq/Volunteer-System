import Env from '@ioc:Adonis/Core/Env'

/**
 * Basic mail config with SMTP driver. Configure via environment variables.
 */
export default {
  driver: Env.get('MAIL_DRIVER', 'smtp'),

  smtp: {
    host: Env.get('MAIL_HOST', 'localhost'),
    port: Env.get('MAIL_PORT', 1025),
    auth: {
      user: Env.get('MAIL_USERNAME', ''),
      pass: Env.get('MAIL_PASSWORD', '')
    },
    secure: Env.get('MAIL_SECURE', false),
    // default from
    from: {
      address: Env.get('MAIL_FROM', 'no-reply@local.test'),
      name: Env.get('MAIL_FROM_NAME', 'Volunteer System')
    }
  }
}
