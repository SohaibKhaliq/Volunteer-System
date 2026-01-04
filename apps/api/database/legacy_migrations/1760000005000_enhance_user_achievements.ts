import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EnhanceUserAchievements extends BaseSchema {
  protected tableName = 'user_achievements'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('granted_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.text('grant_reason').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('granted_by')
      table.dropColumn('grant_reason')
    })
  }
}
