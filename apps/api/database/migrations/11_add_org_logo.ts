
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'organizations'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('logo_url').nullable().after('slug')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('logo_url')
    })
  }
}
