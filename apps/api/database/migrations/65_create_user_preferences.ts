import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'user_preferences'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      // Notification preferences
      table.boolean('email_notifications').defaultTo(true)
      table.boolean('sms_notifications').defaultTo(false)
      table.boolean('push_notifications').defaultTo(true)

      // Communication preferences
      table.boolean('newsletter_subscription').defaultTo(true)
      table.boolean('event_reminders').defaultTo(true)
      table.boolean('shift_reminders').defaultTo(true)
      table.boolean('opportunity_alerts').defaultTo(true)

      // Privacy preferences
      table.boolean('profile_public').defaultTo(false)
      table.boolean('show_email').defaultTo(false)
      table.boolean('show_phone').defaultTo(false)

      // Availability preferences
      table.json('preferred_days').nullable() // ['monday', 'wednesday', 'friday']
      table.string('preferred_time').nullable() // 'morning', 'afternoon', 'evening'
      table.integer('max_hours_per_week').nullable()

      // Other preferences
      table.string('language').defaultTo('en')
      table.string('timezone').defaultTo('Australia/Sydney')
      table.string('theme').defaultTo('light') // 'light', 'dark', 'auto'

      // Metadata for custom preferences
      table.json('custom_preferences').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Ensure one preference record per user
      table.unique(['user_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
