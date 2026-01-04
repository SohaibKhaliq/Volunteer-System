
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'legacy_pivots'

  public async up() {
    this.schema.createTable('help_request_types', (table) => {
      table.increments('id')
      table.integer('help_request_id').unsigned().references('id').inTable('help_requests').onDelete('CASCADE')
      table.integer('type_id').unsigned().references('id').inTable('types').onDelete('CASCADE')
      table.unique(['help_request_id', 'type_id'])
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('offer_types', (table) => {
      table.increments('id')
      table.integer('offer_id').unsigned().references('id').inTable('offers').onDelete('CASCADE')
      table.integer('type_id').unsigned().references('id').inTable('types').onDelete('CASCADE')
      table.unique(['offer_id', 'type_id'])
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable('offer_types')
    this.schema.dropTable('help_request_types')
  }
}
