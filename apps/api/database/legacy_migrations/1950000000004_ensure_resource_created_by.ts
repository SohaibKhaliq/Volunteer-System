import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EnsureResourceCreatedBy extends BaseSchema {
  protected tableName = 'resources'

  public async up() {
    // Check if column exists first or just try to add it using Schema which is safer
    // But schema builder doesn't have "if not exists" easily for columns in all drivers.
    // However, since we are in a fix-forward mode, I'll just add it. If it fails due to duplicate, I'll use raw with catch or just standard add.
    // Given the error was "Unknown column", it definitely doesn't exist.
    if (!await this.schema.hasColumn(this.tableName, 'created_by_id')) {
      this.schema.alterTable(this.tableName, (table) => {
        table.integer('created_by_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()
      })
    }
  }

  public async down() {
    // optional
  }
}
