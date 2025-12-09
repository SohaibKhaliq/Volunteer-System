import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddOwnerToOrganizations extends BaseSchema {
  protected tableName = 'organizations'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('owner_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('owner_id')
    })
  }
}
