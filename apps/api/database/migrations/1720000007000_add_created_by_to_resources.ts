import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddCreatedByToResources extends BaseSchema {
  protected tableName = 'resources'

  public async up() {
    try {
      if (!(await this.schema.hasColumn(this.tableName, 'created_by_id'))) {
        await this.schema.alterTable(this.tableName, (table) => {
          table
            .integer('created_by_id')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('users')
            .onDelete('SET NULL')
        })
      }
    } catch (e) {}
  }

  public async down() {
    try {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('created_by_id')
      })
    } catch (e) {}
  }
}
