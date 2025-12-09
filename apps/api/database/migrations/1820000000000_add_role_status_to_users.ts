import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddRoleStatusToUsers extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // role_id may already exist — this migration adds role_status
      table.string('role_status').notNullable().defaultTo('active')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('role_status')
    })
  }
}
