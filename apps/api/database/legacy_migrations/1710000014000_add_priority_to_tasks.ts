import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddPriorityToTasks extends BaseSchema {
  protected tableName = 'tasks'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('priority', 20).defaultTo('medium')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('priority')
    })
  }
}
