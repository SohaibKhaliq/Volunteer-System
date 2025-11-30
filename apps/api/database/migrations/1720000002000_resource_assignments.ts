import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ResourceAssignments extends BaseSchema {
  protected tableName = 'resource_assignments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('resource_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('resources')
        .onDelete('CASCADE')
      table.string('assignment_type').nullable() // event | volunteer | maintenance
      table.integer('related_id').unsigned().nullable() // event_id or volunteer_id or maintenance record id
      table.timestamp('assigned_at', { useTz: true }).notNullable()
      table.timestamp('expected_return_at', { useTz: true }).nullable()
      table.timestamp('returned_at', { useTz: true }).nullable()
      table.string('status').defaultTo('assigned')
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
