import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'courses'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('description_html').nullable()
      table.boolean('assign_all').defaultTo(false)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('description_html')
      table.dropColumn('assign_all')
    })
  }
}
