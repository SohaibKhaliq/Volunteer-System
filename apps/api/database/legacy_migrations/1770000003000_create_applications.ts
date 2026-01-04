import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateApplications extends BaseSchema {
  protected tableName = 'applications'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('opportunity_id')
        .unsigned()
        .references('id')
        .inTable('opportunities')
        .onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('status').defaultTo('applied') // applied, accepted, rejected, withdrawn
      table.timestamp('applied_at', { useTz: true }).notNullable()
      table.timestamp('responded_at', { useTz: true }).nullable()
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Unique constraint: one application per user per opportunity
      table.unique(['opportunity_id', 'user_id'])
      table.index(['status'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
