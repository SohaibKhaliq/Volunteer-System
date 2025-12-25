import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EnhanceAchievements extends BaseSchema {
  protected tableName = 'achievements'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('category_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('achievement_categories')
        .onDelete('SET NULL')
      table
        .enum('rule_type', ['hours', 'events', 'frequency', 'certification', 'custom'])
        .nullable()
      table.boolean('is_milestone').defaultTo(false)
      table.string('badge_image_url').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('category_id')
      table.dropColumn('rule_type')
      table.dropColumn('is_milestone')
      table.dropColumn('badge_image_url')
    })
  }
}
