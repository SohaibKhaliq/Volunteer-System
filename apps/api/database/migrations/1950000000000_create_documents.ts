import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateDocuments extends BaseSchema {
  protected tableName = 'documents'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('category').defaultTo('other') // 'policy', 'procedure', etc.
      table.string('file_path').notNullable()
      table.string('file_name').notNullable()
      table.string('file_type').nullable()
      table.integer('file_size').unsigned().nullable()
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE').nullable()
      table.boolean('requires_acknowledgment').defaultTo(false)
      table.boolean('is_public').defaultTo(false)
      table.integer('version').defaultTo(1)
      table.string('status').defaultTo('draft') // 'draft', 'published', 'archived'
      table.timestamp('published_at', { useTz: false }).nullable()
      table.timestamp('expires_at', { useTz: false }).nullable()
      table.json('metadata').nullable()
      table.timestamp('created_at', { useTz: false })
      table.timestamp('updated_at', { useTz: false })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
