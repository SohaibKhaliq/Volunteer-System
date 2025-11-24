import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateSurveys extends BaseSchema {
  protected tableName = 'surveys'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table.json('questions').nullable() // store survey questions as JSON array
      table.string('status', 50).defaultTo('draft') // draft | published | closed
      table.json('settings').nullable()
      table.integer('created_by').unsigned().nullable()
      table.timestamp('published_at').nullable()
      table.timestamp('closed_at').nullable()
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
