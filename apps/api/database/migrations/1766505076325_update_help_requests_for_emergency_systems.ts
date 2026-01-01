import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'help_requests'
  protected historyTableName = 'help_request_histories'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('case_id').nullable().unique()
      table.enum('severity', ['low', 'medium', 'high', 'critical']).defaultTo('medium')
      table.integer('urgency_score').defaultTo(0)
      table.boolean('is_verified').defaultTo(false)
      table.enum('contact_method', ['phone', 'email', 'sms', 'whatsapp']).defaultTo('phone')
      table.boolean('consent_given').defaultTo(false)
      table.json('meta_data').nullable()

      table.integer('assigned_team_id').unsigned().nullable()
      table.integer('assigned_volunteer_id').unsigned().references('users.id').onDelete('SET NULL')
    })

    this.schema.createTable(this.historyTableName, (table) => {
      table.increments('id')
      table.integer('help_request_id').unsigned().references('help_requests.id').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('users.id').onDelete('SET NULL').nullable()
      table.string('action').notNullable() // status_change, assignment, update
      table.json('previous_value').nullable()
      table.json('new_value').nullable()
      
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.historyTableName)

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('case_id')
      table.dropColumn('severity')
      table.dropColumn('urgency_score')
      table.dropColumn('is_verified')
      table.dropColumn('contact_method')
      table.dropColumn('consent_given')
      table.dropColumn('meta_data')
      table.dropColumn('assigned_team_id')
      table.dropColumn('assigned_volunteer_id')
    })
  }
}
