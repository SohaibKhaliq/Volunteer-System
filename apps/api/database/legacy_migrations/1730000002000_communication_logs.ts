import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'communication_logs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('communication_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('communications')
        .onDelete('CASCADE')
      table.string('recipient').notNullable()
      table.integer('user_id').unsigned().nullable().references('id').inTable('users')
      table.string('status').notNullable().defaultTo('Pending') // Pending, Success, Failed
      table.integer('attempts').notNullable().defaultTo(0)
      table.text('error').nullable()
      table.timestamp('last_attempt_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
