import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    const hasTable = await this.schema.hasTable('assignments')
    if (!hasTable) {
      return
    }

    const hasColumn = await this.schema.hasColumn('assignments', 'assigned_by')
    if (hasColumn) {
      return
    }

    this.schema.alterTable('assignments', (table) => {
      table.integer('assigned_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
    })
  }

  public async down() {
    this.schema.alterTable('assignments', (table) => {
      table.dropForeign(['assigned_by'])
      table.dropColumn('assigned_by')
    })
  }
}
