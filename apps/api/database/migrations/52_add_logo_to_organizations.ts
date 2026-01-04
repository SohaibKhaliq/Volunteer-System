import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('organizations', (table) => {
      table.string('logo').nullable()
    })
  }

  public async down() {
    this.schema.alterTable('organizations', (table) => {
      table.dropColumn('logo')
    })
  }
}
