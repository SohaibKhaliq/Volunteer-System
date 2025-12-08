import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('cause').nullable() // e.g., 'Environment', 'Disaster Relief'
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cause')
    })
  }
}
