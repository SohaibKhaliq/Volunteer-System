import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('shifts', (table) => {
      table.string('template_name').nullable()
    })
  }

  public async down() {
    this.schema.alterTable('shifts', (table) => {
      table.dropColumn('template_name')
    })
  }
}
