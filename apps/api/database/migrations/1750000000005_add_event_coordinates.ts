import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddEventCoordinates extends BaseSchema {
  protected tableName = 'events'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // add optional latitude/longitude to support map features
      table.decimal('latitude', 9, 6).nullable()
      table.decimal('longitude', 9, 6).nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('latitude')
      table.dropColumn('longitude')
    })
  }
}
