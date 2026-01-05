import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'resources'

  public async up () {
    this.schema.alterTable('resources', (table) => {
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }

  public async down () {
    this.schema.alterTable('resources', (table) => {
      table.dropColumn('deleted_at')
    })
  }
}
