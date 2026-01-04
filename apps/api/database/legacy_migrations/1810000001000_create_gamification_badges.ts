import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateGamificationBadges extends BaseSchema {
  protected tableName = 'gamification_badges'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.string('icon').notNullable()
      table.text('rules_json', 'longtext').notNullable()
      table.integer('xp_reward').defaultTo(0)
      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
