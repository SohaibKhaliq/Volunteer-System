
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // notifications: add expires_at
    if (!await this.schema.hasColumn('notifications', 'expires_at')) {
      this.schema.alterTable('notifications', (table) => {
        table.timestamp('expires_at').nullable()
      })
    }

    // communications: add metadata, recipients 
    // content was added in migration 29, but let's double check or leave it
    if (!await this.schema.hasColumn('communications', 'metadata')) {
      this.schema.alterTable('communications', (table) => {
        table.json('metadata').nullable()
      })
    }
    if (!await this.schema.hasColumn('communications', 'recipients')) {
      this.schema.alterTable('communications', (table) => {
        table.json('recipients').nullable()
      })
    }

    // audit_logs: make entity_type and entity_id nullable
    const auditHasEntityType = await this.schema.hasColumn('audit_logs', 'entity_type')
    if (auditHasEntityType) {
      this.schema.alterTable('audit_logs', (table) => {
        table.string('entity_type').nullable().alter()
      })
    }
    const auditHasEntityId = await this.schema.hasColumn('audit_logs', 'entity_id')
    if (auditHasEntityId) {
      this.schema.alterTable('audit_logs', (table) => {
        table.integer('entity_id').unsigned().nullable().alter()
      })
    }
  }

  public async down() {
    this.schema.alterTable('notifications', (table) => {
      table.dropColumn('expires_at')
    })
    this.schema.alterTable('communications', (table) => {
      table.dropColumn('metadata')
      table.dropColumn('recipients')
    })
    // Reverting audit_logs checks is risky if nulls were introduced, skipping exact revert for that
  }
}
