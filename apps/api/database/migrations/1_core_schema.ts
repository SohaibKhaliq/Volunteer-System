import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'core_schema'

  public async up() {
    this.schema.createTable('users', (table) => {
      table.increments('id')
      table.string('email').notNullable().unique()
      table.string('password').notNullable()
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('phone').nullable()
      table.string('volunteer_status').defaultTo('active')
      table.json('profile_metadata').nullable()
      table.string('role_status').defaultTo('active')
      table.boolean('is_admin').defaultTo(false)
      table.boolean('is_disabled').defaultTo(false)
      table.timestamp('email_verified_at', { useTz: true }).nullable()
      table.timestamp('last_active_at', { useTz: true }).nullable()
      table.string('remember_me_token').nullable()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })

    this.schema.createTable('organizations', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.text('description').nullable()
      table.string('contact_email').nullable()
      table.string('contact_phone').nullable()
      table.string('type').nullable()
      table.string('website').nullable()
      table.string('address').nullable()
      table.string('city').nullable()
      table.string('country').nullable()
      table.string('timezone').defaultTo('Australia/Sydney')
      table.string('status').defaultTo('active')
      table.boolean('is_approved').defaultTo(false)
      table.boolean('is_active').defaultTo(true)
      table.boolean('public_profile').defaultTo(true)
      table.boolean('auto_approve_volunteers').defaultTo(false)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })

    this.schema.createTable('system_settings', (table) => {
      table.increments('id')
      table.string('key').notNullable().unique()
      table.string('value').nullable()
      table.string('type').notNullable().defaultTo('string')
      table.string('category').notNullable().defaultTo('general')
      table.boolean('is_editable').defaultTo(true)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('api_tokens', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('token', 64).notNullable().unique()
      table.string('type').notNullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
      
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable('api_tokens')
    this.schema.dropTable('system_settings')
    this.schema.dropTable('organizations')
    this.schema.dropTable('users')
  }
}
