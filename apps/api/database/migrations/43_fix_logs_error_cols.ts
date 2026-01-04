
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('communication_logs', (table) => {
      table.timestamp('last_attempt_at').nullable()
      table.text('error').nullable()
    })
  }

  public async down() {
    this.schema.alterTable('communication_logs', (table) => {
      table.dropColumn('last_attempt_at')
      table.dropColumn('error')
    })
  }
}
