import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddMediaFieldsToEvents extends BaseSchema {
  protected tableName = 'events'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('image').nullable()
      table.string('banner').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('image')
      table.dropColumn('banner')
    })
  }
}
