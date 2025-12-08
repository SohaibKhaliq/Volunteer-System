import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'assignments'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('check_in_time', { useTz: true }).nullable()
      table.timestamp('check_out_time', { useTz: true }).nullable()
      table.boolean('attendance_verified').defaultTo(false)
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('check_in_time')
      table.dropColumn('check_out_time')
      table.dropColumn('attendance_verified')
    })
  }
}
