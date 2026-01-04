
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'carpooling_ads'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Renames
      table.renameColumn('from_location', 'departure_address')
      table.renameColumn('to_location', 'arrival_address')
      table.renameColumn('departure_time', 'departure_date')
      table.renameColumn('available_seats', 'capacity')
      table.renameColumn('notes', 'description')

      // New columns
      table.timestamp('arrival_date', { useTz: true }).nullable()
      table.decimal('departure_latitude', 10, 8).nullable()
      table.decimal('departure_longitude', 11, 8).nullable()
      table.decimal('arrival_latitude', 10, 8).nullable()
      table.decimal('arrival_longitude', 11, 8).nullable()
      table.json('files').nullable()
      table.string('storage_space').defaultTo('medium')
      table.string('type').defaultTo('offer') // offer or request
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('type')
      table.dropColumn('storage_space')
      table.dropColumn('files')
      table.dropColumn('arrival_longitude')
      table.dropColumn('arrival_latitude')
      table.dropColumn('departure_longitude')
      table.dropColumn('departure_latitude')
      table.dropColumn('arrival_date')

      table.renameColumn('description', 'notes')
      table.renameColumn('capacity', 'available_seats')
      table.renameColumn('departure_date', 'departure_time')
      table.renameColumn('arrival_address', 'to_location')
      table.renameColumn('departure_address', 'from_location')
    })
  }
}
