
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'compliance_documents'

  public async up() {
    this.schema.alterTable('compliance_documents', (table) => {
      // doc_type already exists, only adding issued_at
      table.timestamp('issued_at').nullable()
    })
  }

  public async down() {
    this.schema.alterTable('compliance_documents', (table) => {
      table.dropColumn('issued_at')
    })
  }
}
