import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    const hasTable = await this.schema.hasTable('resources')
    if (!hasTable) {
      return
    }

    // Check if columns already exist
    const hasCreatedById = await this.schema.hasColumn('resources', 'created_by_id')
    const hasAttributes = await this.schema.hasColumn('resources', 'attributes')

    this.schema.alterTable('resources', (table) => {
      if (!hasCreatedById) {
        table.integer('created_by_id').unsigned().nullable().references('id').inTable('users')
      }
      if (!hasAttributes) {
        table.json('attributes').nullable()
      }
    })
  }

  public async down() {
    this.schema.alterTable('resources', (table) => {
      table.dropForeign(['created_by_id'])
      table.dropColumn('created_by_id')
      table.dropColumn('attributes')
    })
  }
}
