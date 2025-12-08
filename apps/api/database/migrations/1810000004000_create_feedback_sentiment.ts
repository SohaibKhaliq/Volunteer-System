import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'feedback_sentiment'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      // Assuming feedback links to a survey response or similar.
      // Existing codebase has 'survey_responses'.
      table.integer('response_id').unsigned().nullable().references('id').inTable('survey_responses').onDelete('CASCADE')
      table.float('ai_score').notNullable() // -1.0 to 1.0
      table.text('ai_summary').nullable()
      table.string('sentiment_label').notNullable() // "Positive", "Neutral", "Negative"
      table.timestamp('analyzed_at', { useTz: true }).defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
