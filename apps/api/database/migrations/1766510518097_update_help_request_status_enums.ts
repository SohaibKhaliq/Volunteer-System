import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'update_help_request_status_enums'

  public async up() {
    this.schema.raw(
      "ALTER TABLE help_requests MODIFY COLUMN status ENUM('requested', 'completed', 'assigned') NOT NULL DEFAULT 'requested'"
    )
  }

  public async down() {
    this.schema.raw(
      "ALTER TABLE help_requests MODIFY COLUMN status ENUM('requested', 'completed') NOT NULL DEFAULT 'requested'"
    )
  }
}
