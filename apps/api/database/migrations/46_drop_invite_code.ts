
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('organization_invites', (table) => {
      table.dropColumn('invite_code')
    })
  }

  public async down() {
    this.schema.alterTable('organization_invites', (table) => {
      table.string('invite_code').notNullable()
    })
  }
}
