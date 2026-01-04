
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // communication_logs: add attempts. Remove try/catch to see error if any.
    // Use raw query to be safe with existing columns check, but since we know it's missing...
    // We'll wrap in try-catch but LOG properly if fails, or just let it throw to see in console.
    // Letting it throw is better now that we know it's missing.
    if (!await this.schema.hasColumn('communication_logs', 'attempts')) {
      this.schema.alterTable('communication_logs', (table) => {
        table.integer('attempts').defaultTo(0)
      })
    }

    // communications: set default for category to 'general' to fix 'no default value' error
    // Use raw to ensure modify works.
    await this.db.raw("ALTER TABLE `communications` MODIFY COLUMN `category` VARCHAR(255) DEFAULT 'general'")
  }

  public async down() {
    this.schema.alterTable('communication_logs', (table) => {
      table.dropColumn('attempts')
    })
  }
}
