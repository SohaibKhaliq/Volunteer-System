
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('user_achievements', (table) => {
      table.json('metadata').nullable()
    })
  }

  public async down() {
    this.schema.alterTable('user_achievements', (table) => {
      table.dropColumn('metadata')
    })
  }
}
