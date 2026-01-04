import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('audit_logs', (table) => {
      table.integer('target_id').unsigned().nullable()
    })
  }

  public async down() {
    this.schema.alterTable('audit_logs', (table) => {
      table.dropColumn('target_id')
    })
  }
}
