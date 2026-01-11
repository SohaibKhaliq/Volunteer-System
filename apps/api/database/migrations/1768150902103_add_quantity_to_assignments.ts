import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('resource_assignments', (table) => {
      table.integer('quantity').defaultTo(1).after('status')
    })
  }

  public async down() {
    this.schema.alterTable('resource_assignments', (table) => {
      table.dropColumn('quantity')
    })
  }
}
