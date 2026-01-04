import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class AddCreatedByToResources extends BaseSchema {
  protected tableName = 'resources'

  public async up() {
    const conn = Database.connection()
    try {
      await conn.raw(
        `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`created_by_id\` INT UNSIGNED NULL`
      )
    } catch (e) {
      // ignore
    }

    try {
      await conn.raw(
        `ALTER TABLE \`${this.tableName}\` ADD CONSTRAINT fk_resources_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL`
      )
    } catch (e) {
      // ignore FK errors
    }
  }

  public async down() {
    try {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('created_by_id')
      })
    } catch (e) {}
  }
}
