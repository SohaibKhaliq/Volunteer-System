
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // communication_logs: add recipient, status, user_id
    // ABSOLUTELY NO CHECKS.
    await this.db.raw("ALTER TABLE `communication_logs` ADD COLUMN `recipient` VARCHAR(255) NULL")
    await this.db.raw("ALTER TABLE `communication_logs` ADD COLUMN `status` VARCHAR(255) DEFAULT 'pending'")
    await this.db.raw("ALTER TABLE `communication_logs` ADD COLUMN `user_id` INT UNSIGNED NULL REFERENCES `users`(`id`) ON DELETE SET NULL")

    // communications: modify category to set default
    await this.db.raw("ALTER TABLE `communications` MODIFY COLUMN `category` VARCHAR(255) DEFAULT 'general'")
  }

  public async down() {
    // No-op
  }
}
