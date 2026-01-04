import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class BackgroundChecks extends BaseSchema {
  protected tableName = 'background_checks'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('status').defaultTo('requested')
      table.text('result').nullable()
      table.timestamp('requested_at', { useTz: true }).nullable()
      table.timestamp('completed_at', { useTz: true }).nullable()
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
