
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // communications: add 'content' if missing
    if (!await this.schema.hasColumn('communications', 'content')) {
      this.schema.alterTable('communications', (table) => {
        table.text('content').nullable()
      })
    }
  }

  public async down() {
    this.schema.alterTable('communications', (table) => {
      table.dropColumn('content')
    })
  }
}
