import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateDocumentAcknowledgments extends BaseSchema {
  protected tableName = 'document_acknowledgments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('document_id').unsigned().references('id').inTable('documents').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.text('notes').nullable()
      table.string('ip_address').nullable()
      table.string('user_agent').nullable()
      table.timestamp('acknowledged_at', { useTz: false }).nullable()
      table.timestamp('created_at', { useTz: false })
      table.timestamp('updated_at', { useTz: false })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
