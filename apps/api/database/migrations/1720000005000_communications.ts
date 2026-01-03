import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'communications'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('subject').notNullable()
      table.text('content').notNullable()
      table.string('type').notNullable() // Email, SMS, etc.
      table.string('status').defaultTo('Draft')
      table.timestamp('send_at', { useTz: true }).nullable()
      table.timestamp('sent_at', { useTz: true }).nullable()
      table.string('target_audience').nullable() // JSON or string identifier

      // New columns required by implementation
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('sender_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.json('recipients').nullable()
      table.json('metadata').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
