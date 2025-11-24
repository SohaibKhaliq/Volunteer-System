import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateSurveyResponses extends BaseSchema {
  protected tableName = 'survey_responses'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('survey_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('surveys')
        .onDelete('CASCADE')
      table.integer('user_id').unsigned().nullable()
      table.json('answers').nullable()
      table.string('ip_address').nullable()
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
