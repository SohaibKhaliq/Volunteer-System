import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateBroadcasts extends BaseSchema {
  protected tableName = 'broadcasts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('created_by_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()
      table.string('title').notNullable()
      table.text('message').notNullable()
      table.enum('priority', ['normal', 'high', 'emergency']).defaultTo('normal')
      table.enum('target_type', ['all', 'organization', 'role', 'custom']).defaultTo('all')
      table.json('target_filter').nullable()
      table.timestamp('scheduled_at', { useTz: true }).nullable()
      table.timestamp('sent_at', { useTz: true }).nullable()
      table.enum('status', ['draft', 'scheduled', 'sending', 'sent', 'failed']).defaultTo('draft')
      table.integer('recipient_count').defaultTo(0)
      table.integer('delivery_count').defaultTo(0)
      table.integer('error_count').defaultTo(0)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Index for querying by status and scheduled time
      table.index(['status', 'scheduled_at'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
