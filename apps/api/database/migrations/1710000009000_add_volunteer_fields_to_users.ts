import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddVolunteerFieldsToUsers extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('first_name').nullable()
      table.string('last_name').nullable()
      table.string('phone').nullable()
      table.timestamp('last_active_at', { useTz: true }).nullable()
      table.string('volunteer_status').defaultTo('active') // active, suspended, inactive
      table.json('profile_metadata').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('first_name')
      table.dropColumn('last_name')
      table.dropColumn('phone')
      table.dropColumn('last_active_at')
      table.dropColumn('volunteer_status')
      table.dropColumn('profile_metadata')
    })
  }
}
