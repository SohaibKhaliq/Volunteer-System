import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    const hasTable = await this.schema.hasTable('tasks')
    if (!hasTable) {
      return
    }

    const hasColumn = await this.schema.hasColumn('tasks', 'status')
    if (hasColumn) {
      return
    }

    this.schema.alterTable('tasks', (table) => {
      table.string('status').nullable().defaultTo('pending')
    })
  }

  public async down() {
    this.schema.alterTable('tasks', (table) => {
      table.dropColumn('status')
    })
  }
}
