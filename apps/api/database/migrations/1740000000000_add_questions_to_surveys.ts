import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddQuestionsToSurveys extends BaseSchema {
  protected tableName = 'surveys'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // add JSON column for questions if it doesn't already exist
      // Note: Adonis schema builder will error if column exists; run only when missing.
      table.json('questions').nullable()
      table.json('settings').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('questions')
      table.dropColumn('settings')
    })
  }
}
