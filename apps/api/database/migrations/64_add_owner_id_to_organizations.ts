import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    const hasTable = await this.schema.hasTable('organizations')
    if (!hasTable) {
      return
    }

    const hasColumn = await this.schema.hasColumn('organizations', 'owner_id')
    if (hasColumn) {
      return
    }

    this.schema.alterTable('organizations', (table) => {
      table.integer('owner_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
    })
  }

  public async down() {
    this.schema.alterTable('organizations', (table) => {
      table.dropForeign(['owner_id'])
      table.dropColumn('owner_id')
    })
  }
}
