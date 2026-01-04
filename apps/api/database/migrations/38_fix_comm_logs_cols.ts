
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // communication_logs: add recipient, status, user_id
    // using raw to avoid duplicate errors if they partially exist (though dump said they are missing)

    try {
      await this.db.raw("ALTER TABLE `communication_logs` ADD COLUMN `recipient` VARCHAR(255) NULL")
    } catch (e) {}

    try {
      await this.db.raw("ALTER TABLE `communication_logs` ADD COLUMN `status` VARCHAR(255) DEFAULT 'pending'")
    } catch (e) {}

    try {
      await this.db.raw("ALTER TABLE `communication_logs` ADD COLUMN `user_id` INT UNSIGNED NULL REFERENCES `users`(`id`) ON DELETE SET NULL")
    } catch (e) {}
  }

  public async down() {
    // No-op
  }
}
