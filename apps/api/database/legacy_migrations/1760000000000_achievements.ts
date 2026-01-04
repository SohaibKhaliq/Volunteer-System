import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Achievements extends BaseSchema {
  protected tableName = 'achievements'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('organization_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('organizations')
        .onDelete('CASCADE')
      table.string('key').notNullable().unique()
      table.string('title').notNullable()
      table.text('description').nullable()
      table.json('criteria').nullable() // JSON shape describing criteria (e.g., { type: 'hours', threshold: 50 })
      table.string('icon').nullable()
      table.integer('points').defaultTo(0)
      table.boolean('is_enabled').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
