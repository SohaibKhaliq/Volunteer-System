import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Tasks extends BaseSchema {
  protected tableName = 'tasks'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.timestamp('start_at', { useTz: true }).nullable()
      table.timestamp('end_at', { useTz: true }).nullable()
      table.integer('slot_count').defaultTo(1)
      table.json('required_skills').nullable()
      table.json('metadata').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
