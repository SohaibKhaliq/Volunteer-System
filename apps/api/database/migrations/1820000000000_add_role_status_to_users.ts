import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('SET NULL').after('id')
      table.string('status').defaultTo('active').after('email') // 'active', 'banned', 'pending'
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('role_id')
      table.dropColumn('status')
    })
  }
}
