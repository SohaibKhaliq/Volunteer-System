
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'compliance_documents'

  public async up() {
    this.schema.alterTable('compliance_documents', (table) => {
      table.json('metadata').nullable()
    })
  }

  public async down() {
    this.schema.alterTable('compliance_documents', (table) => {
      table.dropColumn('metadata')
    })
  }
}
