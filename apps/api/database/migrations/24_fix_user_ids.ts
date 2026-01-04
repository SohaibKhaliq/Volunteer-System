
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // compliance_documents
    if (!await this.schema.hasColumn('compliance_documents', 'user_id')) {
      this.schema.alterTable('compliance_documents', (table) => {
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      })
    }
    if (!await this.schema.hasColumn('compliance_documents', 'organization_id')) {
        this.schema.alterTable('compliance_documents', (table) => {
          table.integer('organization_id').unsigned().nullable().references('id').inTable('organizations').onDelete('CASCADE')
        })
      }

    // background_checks
    if (!await this.schema.hasColumn('background_checks', 'user_id')) {
      this.schema.alterTable('background_checks', (table) => {
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      })
    }
  }

  public async down() {
    // Skip complex down logic for fix-up
  }
}
