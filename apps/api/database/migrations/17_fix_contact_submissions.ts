
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'contact_submissions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('name', 'first_name')
      table.string('last_name').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('last_name')
      table.renameColumn('first_name', 'name')
    })
  }
}
