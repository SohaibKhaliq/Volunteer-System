
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // compliance_documents: drop 'version' via raw to be safe or standardSchema
    if (await this.schema.hasColumn('compliance_documents', 'version')) {
      this.schema.alterTable('compliance_documents', (table) => {
        table.dropColumn('version')
      })
    }

    // notifications: force title nullable using raw query (MySQL syntax)
    // We try to handle this robustly.
    await this.schema.raw("ALTER TABLE `notifications` MODIFY COLUMN `title` VARCHAR(255) NULL")
  }

  public async down() {
    // Revert changes
    this.schema.alterTable('compliance_documents', (table) => {
      table.integer('version').nullable()
    })
    await this.schema.raw("ALTER TABLE `notifications` MODIFY COLUMN `title` VARCHAR(255) NOT NULL")
  }
}
