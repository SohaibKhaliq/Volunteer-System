import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateOpportunities extends BaseSchema {
  protected tableName = 'opportunities'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('organization_id')
        .unsigned()
        .references('id')
        .inTable('organizations')
        .onDelete('CASCADE')
      table
        .integer('team_id')
        .unsigned()
        .references('id')
        .inTable('teams')
        .onDelete('SET NULL')
        .nullable()
      table.string('title').notNullable()
      table.string('slug').unique().nullable()
      table.text('description').nullable()
      table.string('location').nullable()
      table.integer('capacity').defaultTo(0)
      table.string('type').defaultTo('event') // event, recurring, shift
      table.timestamp('start_at', { useTz: true }).notNullable()
      table.timestamp('end_at', { useTz: true }).nullable()
      table.json('recurrence').nullable() // for recurring opportunities
      table.string('status').defaultTo('draft') // draft, published, cancelled
      table.string('visibility').defaultTo('public') // public, org-only, invite-only
      table
        .integer('created_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Indexes
      table.index(['organization_id', 'start_at'])
      table.index(['status'])
      table.index(['slug'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
