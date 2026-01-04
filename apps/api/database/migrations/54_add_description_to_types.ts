import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('types', (table) => {
      table.text('description').nullable()
    })
  }

  public async down() {
    this.schema.alterTable('types', (table) => {
      table.dropColumn('description')
    })
  }
}
