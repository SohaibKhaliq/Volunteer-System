import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EnhanceNotifications extends BaseSchema {
  protected tableName = 'notifications'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Enhanced notification fields
      table.string('title').nullable()
      table.enum('priority', ['low', 'normal', 'high', 'urgent']).defaultTo('normal')
      table.string('category').nullable()
      table.string('action_url').nullable()
      table.string('action_text').nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()

      // Email delivery tracking
      table.boolean('sent_via_email').defaultTo(false)
      table.timestamp('email_sent_at', { useTz: true }).nullable()
      table.text('email_error').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('title')
      table.dropColumn('priority')
      table.dropColumn('category')
      table.dropColumn('action_url')
      table.dropColumn('action_text')
      table.dropColumn('expires_at')
      table.dropColumn('sent_via_email')
      table.dropColumn('email_sent_at')
      table.dropColumn('email_error')
    })
  }
}
