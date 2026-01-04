import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  public async up() {
    this.schema.alterTable('events', (table) => {
      // Add geospatial fields if they don't exist
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      
      // Add recurrence fields
      table.string('recurring_rule').nullable()
      table.boolean('is_recurring').defaultTo(false)
    })

    this.schema.alterTable('opportunities', (table) => {
        // Add geospatial fields if they don't exist
        table.decimal('latitude', 10, 8).nullable()
        table.decimal('longitude', 11, 8).nullable()
    })
  }

  public async down() {
    this.schema.alterTable('opportunities', (table) => {
      table.dropColumn('latitude')
      table.dropColumn('longitude')
    })

    this.schema.alterTable('events', (table) => {
      table.dropColumn('latitude')
      table.dropColumn('longitude')
      table.dropColumn('recurring_rule')
      table.dropColumn('is_recurring')
    })
  }
}
