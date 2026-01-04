import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateFeedbackSentiment extends BaseSchema {
  protected tableName = 'feedback_sentiment'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('response_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('survey_responses')
        .onDelete('CASCADE')
      table.float('ai_score', 8, 2).notNullable()
      table.text('ai_summary').nullable()
      table.string('sentiment_label').notNullable()
      table.timestamp('analyzed_at', { useTz: true }).nullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
