import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'volunteer_hours'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('organization_id')
        .unsigned()
        .references('id')
        .inTable('organizations')
        .onDelete('CASCADE')
        .nullable()
      table
        .integer('shift_id')
        .unsigned()
        .references('id')
        .inTable('shifts')
        .onDelete('SET NULL')
        .nullable()
      table.text('rejection_reason').nullable()
      table.text('notes').nullable()
      table.boolean('locked').defaultTo(false)
      table
        .integer('audited_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('organization_id')
      table.dropColumn('shift_id')
      table.dropColumn('rejection_reason')
      table.dropColumn('notes')
      table.dropColumn('locked')
      table.dropColumn('audited_by')
    })
  }
}
