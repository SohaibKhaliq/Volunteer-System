import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'events_opportunities_schema'

  public async up() {
    this.schema.createTable('opportunities', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('title').notNullable()
      table.string('slug').notNullable().unique()
      table.text('description').nullable()
      table.string('location').nullable()
      table.integer('capacity').defaultTo(0)
      table.string('type').defaultTo('event')
      table.timestamp('start_at', { useTz: true }).nullable()
      table.timestamp('end_at', { useTz: true }).nullable()
      table.string('status').defaultTo('draft')
      table.string('visibility').defaultTo('public')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('events', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('location').nullable()
      table.timestamp('start_at', { useTz: true }).nullable()
      table.timestamp('end_at', { useTz: true }).nullable()
      table.integer('capacity').defaultTo(0)
      table.boolean('is_published').defaultTo(false)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('applications', (table) => {
      table.increments('id')
      table.integer('opportunity_id').unsigned().references('id').inTable('opportunities').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('status').defaultTo('applied')
      table.timestamp('applied_at', { useTz: true }).nullable()
      table.timestamp('responded_at', { useTz: true }).nullable()
      table.text('notes').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['opportunity_id', 'user_id'])
    })
  }

  public async down() {
    this.schema.dropTable('applications')
    this.schema.dropTable('events')
    this.schema.dropTable('opportunities')
  }
}
