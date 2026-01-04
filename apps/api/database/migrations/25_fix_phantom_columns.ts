
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // compliance_documents: drop 'title' if exists (phantom column)
    if (await this.schema.hasColumn('compliance_documents', 'title')) {
      this.schema.alterTable('compliance_documents', (table) => {
        table.dropColumn('title')
      })
    }

    // background_checks: add 'status' if missing
    if (!await this.schema.hasColumn('background_checks', 'status')) {
      this.schema.alterTable('background_checks', (table) => {
        table.string('status').defaultTo('pending')
      })
    }
  }

  public async down() {
    // Revert changes (add title back, drop status)
    // For 'title', we don't know the original type, assuming string.
    this.schema.alterTable('compliance_documents', (table) => {
      table.string('title').nullable()
    })
    this.schema.alterTable('background_checks', (table) => {
      table.dropColumn('status')
    })
  }
}
