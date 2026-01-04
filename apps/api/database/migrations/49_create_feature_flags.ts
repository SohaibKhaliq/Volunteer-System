import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.createTable('feature_flags', (table) => {
      table.increments('id')
      table.string('key').notNullable().unique()
      table.text('description').nullable()
      table.boolean('enabled').defaultTo(false)
      table.json('conditions').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable('feature_flags')
  }
}
