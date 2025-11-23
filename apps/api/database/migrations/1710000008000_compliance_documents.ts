import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ComplianceDocuments extends BaseSchema {
  protected tableName = 'compliance_documents'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('doc_type').notNullable()
      table.string('status').defaultTo('submitted')
      table.timestamp('issued_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.json('metadata').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
