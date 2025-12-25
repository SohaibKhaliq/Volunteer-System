import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AchievementProgress extends BaseSchema {
  protected tableName = 'achievement_progress'

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
      table.decimal('current_value', 10, 2).defaultTo(0)
      table.decimal('target_value', 10, 2).notNullable()
      table.integer('percentage').defaultTo(0)
      table.timestamp('last_evaluated_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.unique(['user_id', 'achievement_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
