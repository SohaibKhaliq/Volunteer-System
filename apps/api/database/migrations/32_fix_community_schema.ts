
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // missing broadcasts table
    if (!await this.schema.hasTable('broadcasts')) {
      this.schema.createTable('broadcasts', (table) => {
        table.increments('id')
        table.string('title').notNullable()
        table.text('message').notNullable()
        table.string('status').defaultTo('draft')
        table.string('priority').defaultTo('normal')
        table.string('target_type').defaultTo('all')
        table.json('target_filter').nullable()
        table.integer('recipient_count').defaultTo(0)
        table.integer('delivery_count').defaultTo(0)
        table.integer('error_count').defaultTo(0)
        table.integer('created_by_id').unsigned().references('id').inTable('users').onDelete('SET NULL')
        table.timestamp('created_at', { useTz: true })
        table.timestamp('updated_at', { useTz: true })
      })
    }

    // surveys: add settings
    if (!await this.schema.hasColumn('surveys', 'settings')) {
      this.schema.alterTable('surveys', (table) => {
        table.json('settings').nullable()
      })
    }

    // Double check communications: ensure all recently added cols exist
    // content, metadata, recipients, send_at
    // We already added them in 29, 30, 31 but if something went wrong...
    
    // Check content again
    if (!await this.schema.hasColumn('communications', 'content')) {
      this.schema.alterTable('communications', (table) => {
        table.text('content').nullable()
      })
    }
  }

  public async down() {
    this.schema.dropTableIfExists('broadcasts')
    this.schema.alterTable('surveys', (table) => {
      table.dropColumn('settings')
    })
  }
}
