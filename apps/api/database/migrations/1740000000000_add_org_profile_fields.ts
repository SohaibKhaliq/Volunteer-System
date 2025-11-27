import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddOrgProfileFields extends BaseSchema {
  protected tableName = 'organizations'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.string('logo').nullable()
      table.string('type').nullable()
      table.string('website').nullable()
      table.text('address').nullable()
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('logo')
      table.dropColumn('type')
      table.dropColumn('website')
      table.dropColumn('address')
    })
  }
}
