import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddLatitudeLongitudeToOpportunities extends BaseSchema {
  protected tableName = 'opportunities'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('latitude')
      table.dropColumn('longitude')
    })
  }
}
