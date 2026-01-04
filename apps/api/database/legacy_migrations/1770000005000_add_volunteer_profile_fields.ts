import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddVolunteerProfileFields extends BaseSchema {
  protected tableName = 'organization_volunteers'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.json('documents').nullable() // links to uploaded files
      table.json('profile_data').nullable() // additional profile data
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('documents')
      table.dropColumn('profile_data')
    })
  }
}
