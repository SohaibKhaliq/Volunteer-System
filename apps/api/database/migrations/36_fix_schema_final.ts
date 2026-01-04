
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // We use raw queries to correctly handle "if exists" or "duplicate column" errors
    // which the schema builder doesn't let us catch easily.

    // 1. communications.category nullable
    try {
      // Syntax for MySQL
      await this.db.raw("ALTER TABLE `communications` MODIFY COLUMN `category` VARCHAR(255) NULL")
    } catch (e) {
      console.log('Skipping category modify:', e.message)
    }

    // 2. communication_logs.attempts
    try {
      await this.db.raw("ALTER TABLE `communication_logs` ADD COLUMN `attempts` INT DEFAULT 0")
    } catch (e) {
      console.log('Skipping attempts add:', e.message)
    }

    // 3. survey_responses.answers
    try {
      await this.db.raw("ALTER TABLE `survey_responses` ADD COLUMN `answers` JSON NULL")
    } catch (e) {
       console.log('Skipping answers add:', e.message)
    }

    // 4. courses.assign_all
    try {
      await this.db.raw("ALTER TABLE `courses` ADD COLUMN `assign_all` BOOLEAN DEFAULT FALSE")
    } catch (e) {
      console.log('Skipping assign_all add:', e.message)
    }

    // 5. sender_id (just in case check)
    try {
      await this.db.raw("ALTER TABLE `communications` ADD COLUMN `sender_id` INT UNSIGNED NULL REFERENCES `users`(`id`) ON DELETE SET NULL")
    } catch (e) {
      console.log('Skipping sender_id add:', e.message)
    }
  }

  public async down() {
    // No-op
  }
}
