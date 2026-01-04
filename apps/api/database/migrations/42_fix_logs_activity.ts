
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('communication_logs', (table) => {
      table.string('activity_type').nullable().alter()
    })
  }

  public async down() {
    // No-op
  }
}
