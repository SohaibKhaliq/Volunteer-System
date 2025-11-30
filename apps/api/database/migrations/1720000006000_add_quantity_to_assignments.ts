import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddQuantityToAssignments extends BaseSchema {
  protected tableName = 'resource_assignments'

  public async up() {
    try {
      if (!(await this.schema.hasColumn(this.tableName, 'quantity'))) {
        await this.schema.alterTable(this.tableName, (table) => {
          table.integer('quantity').defaultTo(1)
        })
      }
    } catch (e) {
      // ignore
    }
  }

  public async down() {
    try {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('quantity')
      })
    } catch (e) {}
  }
}
