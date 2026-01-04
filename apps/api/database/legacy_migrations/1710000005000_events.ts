import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Events extends BaseSchema {
  protected tableName = 'events'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('organization_id')
        .unsigned()
        .references('id')
        .inTable('organizations')
        .onDelete('SET NULL')
        .nullable()
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('location').nullable()
      table.timestamp('start_at', { useTz: true }).notNullable()
      table.timestamp('end_at', { useTz: true }).nullable()
      table.string('recurring_rule').nullable() // e.g. rrule string
      table.integer('capacity').defaultTo(0)
      table.json('metadata').nullable()
      table.boolean('is_published').defaultTo(false)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
