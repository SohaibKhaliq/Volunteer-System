import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    const hasTable = await this.schema.hasTable('organization_invites')
    if (!hasTable) {
      return
    }

    const hasColumn = await this.schema.hasColumn('organization_invites', 'message')
    if (hasColumn) {
      return
    }

    this.schema.alterTable('organization_invites', (table) => {
      table.text('message').nullable()
    })
  }

  public async down() {
    this.schema.alterTable('organization_invites', (table) => {
      table.dropColumn('message')
    })
  }
}
