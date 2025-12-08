import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'organizations'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('owner_id').unsigned().references('id').inTable('users').onDelete('SET NULL').after('id')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('owner_id')
    })
  }
}
