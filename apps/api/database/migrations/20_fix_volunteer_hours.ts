
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'volunteer_hours'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('notes').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('notes')
    })
  }
}
