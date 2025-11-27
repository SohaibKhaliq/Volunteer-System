import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddIsRecurringToEvents extends BaseSchema {
  protected tableName = 'events'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_recurring').defaultTo(false)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_recurring')
    })
  }
}
