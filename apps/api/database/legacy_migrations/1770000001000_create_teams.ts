import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateTeams extends BaseSchema {
  protected tableName = 'teams'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('organization_id')
        .unsigned()
        .references('id')
        .inTable('organizations')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.text('description').nullable()
      table
        .integer('lead_user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Indexes
      table.index(['organization_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
