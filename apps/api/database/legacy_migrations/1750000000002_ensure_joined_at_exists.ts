import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EnsureJoinedAtExists extends BaseSchema {
  protected tableName = 'organization_volunteers'

  public async up() {
    // Use raw SQL with IF NOT EXISTS which is safe on MySQL 8+ and avoids throwing
    // when running against databases that already have the column.
    await this.schema.raw(
      `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`joined_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    )
  }

  public async down() {
    // Remove the column if it exists
    await this.schema.raw(`ALTER TABLE \`${this.tableName}\` DROP COLUMN IF EXISTS \`joined_at\``)
  }
}
