import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddOrgSettings extends BaseSchema {
  protected tableName = 'organizations'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.boolean('public_profile').defaultTo(false)
      table.boolean('auto_approve_volunteers').defaultTo(false)
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('public_profile')
      table.dropColumn('auto_approve_volunteers')
    })
  }
}
