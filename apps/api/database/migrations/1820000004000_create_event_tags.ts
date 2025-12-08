import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateEventTags extends BaseSchema {
  protected tableName = 'event_tags'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')
      table.integer('tag_id').unsigned().references('id').inTable('tags').onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.unique(['event_id', 'tag_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
