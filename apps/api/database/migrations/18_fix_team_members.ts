
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'organization_team_members'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('organization_id')
    })
  }
}
