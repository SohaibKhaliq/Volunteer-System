
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // compliance_documents
    if (!await this.schema.hasColumn('compliance_documents', 'doc_type')) {
      this.schema.alterTable('compliance_documents', (table) => {
        table.string('doc_type').nullable()
      })
    }
    if (!await this.schema.hasColumn('compliance_documents', 'issued_at')) {
      this.schema.alterTable('compliance_documents', (table) => {
        table.timestamp('issued_at').nullable()
      })
    }
    if (!await this.schema.hasColumn('compliance_documents', 'status')) {
      this.schema.alterTable('compliance_documents', (table) => {
        table.string('status').defaultTo('pending')
      })
    }
    if (!await this.schema.hasColumn('compliance_documents', 'expires_at')) {
      this.schema.alterTable('compliance_documents', (table) => {
        table.timestamp('expires_at').nullable()
      })
    }
     if (!await this.schema.hasColumn('compliance_documents', 'metadata')) {
      this.schema.alterTable('compliance_documents', (table) => {
        table.json('metadata').nullable()
      })
    }

    // background_checks
    if (!await this.schema.hasColumn('background_checks', 'notes')) {
      this.schema.alterTable('background_checks', (table) => {
        table.text('notes').nullable()
      })
    }
    if (!await this.schema.hasColumn('background_checks', 'requested_at')) {
      this.schema.alterTable('background_checks', (table) => {
        table.timestamp('requested_at').nullable()
      })
    }
    if (!await this.schema.hasColumn('background_checks', 'completed_at')) {
      this.schema.alterTable('background_checks', (table) => {
        table.timestamp('completed_at').nullable()
      })
    }
    if (!await this.schema.hasColumn('background_checks', 'result')) {
      this.schema.alterTable('background_checks', (table) => {
        table.string('result').nullable()
      })
    }

    // document_acknowledgments
    if (!await this.schema.hasColumn('document_acknowledgments', 'notes')) {
      this.schema.alterTable('document_acknowledgments', (table) => {
        table.text('notes').nullable()
      })
    }
    if (!await this.schema.hasColumn('document_acknowledgments', 'ip_address')) {
      this.schema.alterTable('document_acknowledgments', (table) => {
        table.string('ip_address').nullable()
      })
    }
    if (!await this.schema.hasColumn('document_acknowledgments', 'user_agent')) {
      this.schema.alterTable('document_acknowledgments', (table) => {
        table.string('user_agent').nullable()
      })
    }
    
    // documents
    if (!await this.schema.hasColumn('documents', 'metadata')) {
      this.schema.alterTable('documents', (table) => {
        table.json('metadata').nullable()
      })
    }
  }

  public async down() {
    // We strictly won't drop them here to avoid data loss if they existed before.
    // This is a "fix" migration.
    // But for typical down compliance:
    // We can conditionally drop if we want, but usually down is blind.
    // Let's leave down empty or minimal to avoid breaking things further.
    // Or we attempt to drop if exists logic, but Knex doesn't support 'dropColumnIfExists'.
    // We'll skip complex down logic for this fix-up migration.
  }
}
