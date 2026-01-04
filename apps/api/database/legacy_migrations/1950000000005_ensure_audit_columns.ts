import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EnsureAuditColumns extends BaseSchema {
  protected tableName = 'audit_logs'

  public async up() {
    if (!await this.schema.hasColumn(this.tableName, 'target_id')) {
      this.schema.alterTable(this.tableName, (table) => {
        table.integer('target_id').unsigned().nullable()
        table.string('target_type').nullable()
        table.text('metadata').nullable()
      })
    }
  }

  public async down() {
    // optional
  }
}
