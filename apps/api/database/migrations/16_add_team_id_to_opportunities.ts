import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'opportunities'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('team_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('teams')
        .onDelete('SET NULL')
      table
        .integer('created_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('checkin_code').nullable()
    })
  }

  public async down() {
    if (await this.schema.hasTable(this.tableName)) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropForeign(['team_id'])
        table.dropForeign(['created_by'])
        table.dropColumn('team_id')
        table.dropColumn('created_by')
        table.dropColumn('checkin_code')
      })
    }
  }
}
