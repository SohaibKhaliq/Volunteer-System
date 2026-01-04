
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // communication_logs: add recipient, status, user_id
    // No try-catch. We want to know if it fails.
    
    // Check if column exists first to be safe against partial success? 
    // Dump says they don't exist. So we add.
    // If they exist, it will throw Duplicate Column, which is informative.

    const hasRecipient = await this.schema.hasColumn('communication_logs', 'recipient')
    if (!hasRecipient) {
      await this.db.raw("ALTER TABLE `communication_logs` ADD COLUMN `recipient` VARCHAR(255) NULL")
    }

    const hasStatus = await this.schema.hasColumn('communication_logs', 'status')
    if (!hasStatus) {
      await this.db.raw("ALTER TABLE `communication_logs` ADD COLUMN `status` VARCHAR(255) DEFAULT 'pending'")
    }

    const hasUserId = await this.schema.hasColumn('communication_logs', 'user_id')
    if (!hasUserId) {
      await this.db.raw("ALTER TABLE `communication_logs` ADD COLUMN `user_id` INT UNSIGNED NULL REFERENCES `users`(`id`) ON DELETE SET NULL")
    }

    // communications: set default for category
    // Use ALTER COLUMN SET DEFAULT syntax
    await this.db.raw("ALTER TABLE `communications` ALTER COLUMN `category` SET DEFAULT 'general'")
  }

  public async down() {
    // No-op
  }
}
