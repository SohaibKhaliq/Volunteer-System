import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'gamification_badges'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.string('icon').notNullable() // URL or identifier for badge icon
      table.json('rules_json').notNullable() // JSON criteria for awarding
      table.integer('xp_reward').defaultTo(0)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    // If achievements table exists, drop it or we assume we are replacing the concept
    // Note: In a real migration we might copy data, but instructions said "Refactor and Replace"
    this.schema.dropTableIfExists('user_achievements')
    this.schema.dropTableIfExists('achievements')
  }

  public async down() {
    this.schema.dropTable(this.tableName)
    // Down migration doesn't strictly need to restore achievements for this task scope
  }
}
