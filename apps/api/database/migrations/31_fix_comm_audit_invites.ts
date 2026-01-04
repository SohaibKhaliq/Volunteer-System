
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // communications: add send_at
    if (!await this.schema.hasColumn('communications', 'send_at')) {
      this.schema.alterTable('communications', (table) => {
        table.timestamp('send_at').nullable()
      })
    }

    // audit_logs: add details
    if (!await this.schema.hasColumn('audit_logs', 'details')) {
      this.schema.alterTable('audit_logs', (table) => {
        table.text('details').nullable()
      })
    }

    // organization_invites: add first_name, last_name
    if (!await this.schema.hasColumn('organization_invites', 'first_name')) {
      this.schema.alterTable('organization_invites', (table) => {
        table.string('first_name').nullable()
      })
    }
    if (!await this.schema.hasColumn('organization_invites', 'last_name')) {
      this.schema.alterTable('organization_invites', (table) => {
        table.string('last_name').nullable()
      })
    }
  }

  public async down() {
    this.schema.alterTable('communications', (table) => {
      table.dropColumn('send_at')
    })
    this.schema.alterTable('audit_logs', (table) => {
      table.dropColumn('details')
    })
    this.schema.alterTable('organization_invites', (table) => {
      table.dropColumn('first_name')
      table.dropColumn('last_name')
    })
  }
}
