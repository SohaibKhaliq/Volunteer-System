import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateComplianceLogs extends BaseSchema {
  protected tableName = 'compliance_logs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('check_provider').notNullable()
      table.string('status').notNullable()
      table.timestamp('verified_at', { useTz: true }).nullable()
      table.text('meta_data', 'longtext').nullable()
      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
