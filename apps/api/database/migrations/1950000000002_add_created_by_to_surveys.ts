import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddCreatedByToSurveys extends BaseSchema {
  protected tableName = 'surveys'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('created_by')
    })
  }
}
