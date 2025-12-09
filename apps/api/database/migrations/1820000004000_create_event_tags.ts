import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateEventTags extends BaseSchema {
  protected tableName = 'event_tags'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('event_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('events')
        .onDelete('CASCADE')
      table
        .integer('tag_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('tags')
        .onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
