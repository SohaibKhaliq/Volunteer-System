import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddColumnsToSurveyResponses extends BaseSchema {
  protected tableName = 'survey_responses'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('ip_address').nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ip_address')
      table.dropColumn('updated_at')
    })
  }
}
