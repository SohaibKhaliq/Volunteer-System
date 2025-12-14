import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateAchievementsIfMissing extends BaseSchema {
  protected tableName = 'achievements'

  public async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      // Table already exists, nothing to do
      return
    }

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
      table.json('criteria').nullable()
      table.string('icon').nullable()
      table.integer('points').defaultTo(0)
      table.boolean('is_enabled').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  public async down() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      this.schema.dropTable(this.tableName)
    }
  }
}
