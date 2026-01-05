import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'background_checks'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('file_path').nullable()
      table.string('file_name').nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('file_path')
      table.dropColumn('file_name')
    })
  }
}
