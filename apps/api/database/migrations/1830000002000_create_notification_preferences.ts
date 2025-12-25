import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateNotificationPreferences extends BaseSchema {
  protected tableName = 'notification_preferences'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('notification_type').notNullable()
      table.boolean('in_app_enabled').defaultTo(true)
      table.boolean('email_enabled').defaultTo(true)
      table.enum('frequency', ['instant', 'daily_digest', 'weekly_digest']).defaultTo('instant')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Unique constraint: one preference per user per notification type
      table.unique(['user_id', 'notification_type'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
