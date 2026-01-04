import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UserAchievements extends BaseSchema {
  protected tableName = 'user_achievements'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('achievement_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('achievements')
        .onDelete('CASCADE')
      table.json('metadata').nullable()
      table.timestamp('awarded_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.unique(['user_id', 'achievement_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
