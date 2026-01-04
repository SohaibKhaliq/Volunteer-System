import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddSlugToRoles extends BaseSchema {
  protected tableName = 'roles'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('slug').nullable().unique()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('slug')
    })
  }
}
