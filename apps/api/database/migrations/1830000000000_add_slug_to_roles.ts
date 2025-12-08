import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddSlugToRoles extends BaseSchema {
  protected tableName = 'roles'

  public async up() {
    const hasSlug = await this.schema.hasColumn(this.tableName, 'slug')
    if (!hasSlug) {
      this.schema.alterTable(this.tableName, (table) => {
        table.string('slug').nullable().unique()
      })
    }
  }

  public async down() {
    const hasSlug = await this.schema.hasColumn(this.tableName, 'slug')
    if (hasSlug) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('slug')
      })
    }
  }
}
