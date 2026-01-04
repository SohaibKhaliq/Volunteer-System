import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('volunteer_hours', (table) => {
      table.integer('audited_by').unsigned().nullable().references('id').inTable('users')
      table.text('rejection_reason').nullable()
    })
  }

  public async down() {
    this.schema.alterTable('volunteer_hours', (table) => {
      table.dropForeign(['audited_by'])
      table.dropColumn('audited_by')
      table.dropColumn('rejection_reason')
    })
  }
}
