
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.createTable('scheduled_jobs', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('type').notNullable()
      table.text('payload').nullable()
      table.timestamp('run_at').notNullable()
      table.string('status').defaultTo('pending')
      table.integer('attempts').defaultTo(0)
      table.text('last_error').nullable()
      table.timestamp('last_run_at').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('notification_preferences', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('notification_type').notNullable()
      table.boolean('in_app_enabled').defaultTo(true)
      table.boolean('email_enabled').defaultTo(true)
      table.enu('frequency', ['instant', 'daily_digest', 'weekly_digest']).defaultTo('instant')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.alterTable('survey_responses', (table) => {
      table.string('ip_address').nullable()
    })
  }

  public async down() {
    this.schema.alterTable('survey_responses', (table) => {
      table.dropColumn('ip_address')
    })
    this.schema.dropTable('notification_preferences')
    this.schema.dropTable('scheduled_jobs')
  }
}
