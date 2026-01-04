
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // compliance_documents: drop 'document_type' if exists (phantom column, we use 'doc_type')
    if (await this.schema.hasColumn('compliance_documents', 'document_type')) {
      this.schema.alterTable('compliance_documents', (table) => {
        table.dropColumn('document_type')
      })
    }

    // notifications: make 'title' nullable
    if (await this.schema.hasColumn('notifications', 'title')) {
      this.schema.alterTable('notifications', (table) => {
        table.string('title').nullable().alter()
      })
    } else {
      // If it doesn't exist (unlikely given the error), add it as nullable
      this.schema.alterTable('notifications', (table) => {
        table.string('title').nullable()
      })
    }
  }

  public async down() {
    // Revert changes
    this.schema.alterTable('compliance_documents', (table) => {
      table.string('document_type').nullable()
    })
    this.schema.alterTable('notifications', (table) => {
      table.string('title').notNullable().alter()
    })
  }
}
