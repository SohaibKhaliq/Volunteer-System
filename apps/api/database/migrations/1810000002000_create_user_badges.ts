import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateUserBadges extends BaseSchema {
  protected tableName = 'user_badges'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('badge_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('gamification_badges')
        .onDelete('CASCADE')
      table.timestamp('awarded_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
