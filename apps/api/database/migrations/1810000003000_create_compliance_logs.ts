import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'compliance_logs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('check_provider').notNullable() // e.g. "Checkr", "Internal"
      table.string('status').notNullable() // e.g. "verified", "flagged", "pending"
      table.timestamp('verified_at', { useTz: true }).nullable()
      table.json('meta_data').nullable() // Extra data from provider
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
