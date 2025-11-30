import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class AddQuantityToAssignments extends BaseSchema {
  protected tableName = 'resource_assignments'

  public async up() {
    const conn = Database.connection()
    try {
      await conn.raw(
        `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`quantity\` INT DEFAULT 1`
      )
    } catch (e) {
      // ignore to keep migration idempotent
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
