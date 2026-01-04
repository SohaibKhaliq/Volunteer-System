import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddCheckinCodeToOpportunities extends BaseSchema {
  protected tableName = 'opportunities'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.string('checkin_code', 64).nullable().unique()
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('checkin_code')
    })
  }
}
