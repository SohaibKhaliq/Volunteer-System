import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'achievements'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('key').nullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('key').notNullable().alter()
    })
  }
}
