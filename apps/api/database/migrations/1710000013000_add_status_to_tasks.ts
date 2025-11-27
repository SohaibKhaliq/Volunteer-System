import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddStatusToTasks extends BaseSchema {
  protected tableName = 'tasks'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('status', 50).defaultTo('pending')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
    })
  }
}
