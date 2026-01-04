import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    const hasTable = await this.schema.hasTable('volunteer_hours')
    if (!hasTable) {
      return
    }

    const hasColumn = await this.schema.hasColumn('volunteer_hours', 'shift_id')
    if (hasColumn) {
      return
    }

    this.schema.alterTable('volunteer_hours', (table) => {
      table.integer('shift_id').unsigned().nullable().references('id').inTable('shifts').onDelete('SET NULL')
    })
  }

  public async down() {
    this.schema.alterTable('volunteer_hours', (table) => {
      table.dropForeign(['shift_id'])
      table.dropColumn('shift_id')
    })
  }
}
