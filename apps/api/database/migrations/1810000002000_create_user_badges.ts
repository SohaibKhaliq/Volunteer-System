import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'user_badges'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('badge_id').unsigned().references('id').inTable('gamification_badges').onDelete('CASCADE')
      table.timestamp('awarded_at', { useTz: true }).defaultTo(this.now())

      table.unique(['user_id', 'badge_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
