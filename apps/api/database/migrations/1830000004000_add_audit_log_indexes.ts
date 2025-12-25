import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddAuditLogIndexes extends BaseSchema {
  protected tableName = 'audit_logs'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Index for filtering by user (actor)
      table.index(['user_id'], 'audit_logs_user_id_index')

      // Index for filtering by action type
      table.index(['action'], 'audit_logs_action_index')

      // Index for date range queries
      table.index(['created_at'], 'audit_logs_created_at_index')

      // Composite index for entity lookups
      table.index(['target_type', 'target_id'], 'audit_logs_target_index')

      // Index for security audits by IP
      table.index(['ip_address'], 'audit_logs_ip_address_index')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['user_id'], 'audit_logs_user_id_index')
      table.dropIndex(['action'], 'audit_logs_action_index')
      table.dropIndex(['created_at'], 'audit_logs_created_at_index')
      table.dropIndex(['target_type', 'target_id'], 'audit_logs_target_index')
      table.dropIndex(['ip_address'], 'audit_logs_ip_address_index')
    })
  }
}
