import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateInviteSendJobs extends BaseSchema {
  protected tableName = 'invite_send_jobs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('organization_invite_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('organization_invites')
        .onDelete('CASCADE')

      table.string('status', 50).notNullable().defaultTo('pending') // pending, processing, sent, failed
      table.integer('attempts').unsigned().notNullable().defaultTo(0)
      table.timestamp('next_attempt_at').nullable()
      table.text('last_error').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Prevent duplicate job records per invite
      table.unique(['organization_invite_id'])

      // lookup indexes for processing
      table.index(['status', 'next_attempt_at'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
