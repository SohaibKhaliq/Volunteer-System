import Schema from '@ioc:Adonis/Lucid/Schema'

export default class AddPasswordResetToUsers extends Schema {
  protected tableName = 'users'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('password_reset_token').nullable().index()
      table.timestamp('password_reset_expires_at', { useTz: true }).nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('password_reset_token')
      table.dropColumn('password_reset_expires_at')
    })
  }
}
