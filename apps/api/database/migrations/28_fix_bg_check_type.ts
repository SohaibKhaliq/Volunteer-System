
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // background_checks: drop 'check_type' if exists (phantom column)
    if (await this.schema.hasColumn('background_checks', 'check_type')) {
      this.schema.alterTable('background_checks', (table) => {
        table.dropColumn('check_type')
      })
    }
  }

  public async down() {
    this.schema.alterTable('background_checks', (table) => {
      // Re-add check_type as nullable if reverting
      table.string('check_type').nullable()
    })
  }
}
