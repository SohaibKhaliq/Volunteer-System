import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'legacy_misc_schema'

  public async up() {
    this.schema.createTable('types', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('for_entity').defaultTo('both')
      table.string('icon').nullable()
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('help_requests', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('urgency').defaultTo('medium')
      table.string('status').defaultTo('open')
      table.string('location').nullable()
      table.string('contact_phone').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('offers', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('category').notNullable()
      table.string('status').defaultTo('available')
      table.string('location').nullable()
      table.string('contact_phone').nullable()
      table.string('availability').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('carpooling_ads', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('from_location').notNullable()
      table.string('to_location').notNullable()
      table.timestamp('departure_time', { useTz: true }).nullable()
      table.integer('available_seats').defaultTo(1)
      table.integer('price_per_seat').defaultTo(0)
      table.string('status').defaultTo('active')
      table.text('notes').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('contact_submissions', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('email').notNullable()
      table.string('phone').nullable()
      table.string('subject').notNullable()
      table.text('message').nullable()
      table.string('status').defaultTo('new')
      table.string('ip_address').nullable()
      table.string('user_agent').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable('contact_submissions')
    this.schema.dropTable('carpooling_ads')
    this.schema.dropTable('offers')
    this.schema.dropTable('help_requests')
    this.schema.dropTable('types')
  }
}
