import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class AddResourceEnhancements extends BaseSchema {
  protected tableName = 'resources'

  public async up() {
    const conn = Database.connection()

    const addIfNotExists = async (sql: string) => {
      try {
        await conn.raw(sql)
      } catch (e) {
        // best-effort: continue on error to keep migration idempotent
      }
    }

    await addIfNotExists(
      `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`deleted_at\` TIMESTAMP NULL`
    )

    await addIfNotExists(
      `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`location_room\` VARCHAR(255) NULL`
    )
    await addIfNotExists(
      `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`location_shelf\` VARCHAR(255) NULL`
    )
    await addIfNotExists(
      `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`location_building\` VARCHAR(255) NULL`
    )

    await addIfNotExists(
      `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`last_maintenance_at\` TIMESTAMP NULL`
    )
    await addIfNotExists(
      `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`next_maintenance_at\` TIMESTAMP NULL`
    )
    await addIfNotExists(
      `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`assigned_technician_id\` INT NULL`
    )

    // Best-effort: try to add FK; ignore errors if it already exists or cannot be created
    try {
      await conn.raw(
        `ALTER TABLE \`${this.tableName}\` ADD CONSTRAINT fk_resources_assigned_technician FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL`
      )
    } catch (e) {}
  }

  public async down() {
    try {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('deleted_at')
        table.dropColumn('location_room')
        table.dropColumn('location_shelf')
        table.dropColumn('location_building')
        table.dropColumn('last_maintenance_at')
        table.dropColumn('next_maintenance_at')
        table.dropColumn('assigned_technician_id')
      })
    } catch (e) {}
  }
}
