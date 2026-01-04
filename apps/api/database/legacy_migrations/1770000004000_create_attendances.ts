import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateAttendances extends BaseSchema {
  protected tableName = 'attendances'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('opportunity_id')
        .unsigned()
        .references('id')
        .inTable('opportunities')
        .onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('check_in_at', { useTz: true }).nullable()
      table.timestamp('check_out_at', { useTz: true }).nullable()
      table.string('method').defaultTo('manual') // manual, qr, biometric
      table.json('metadata').nullable() // device id, ip, etc.
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Composite index for fast lookups
      table.index(['opportunity_id', 'user_id', 'check_in_at'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
