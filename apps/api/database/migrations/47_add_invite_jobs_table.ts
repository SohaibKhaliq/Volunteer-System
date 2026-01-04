
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.createTable('invite_send_jobs', (table) => {
      table.increments('id')
      table.integer('organization_invite_id').unsigned().references('id').inTable('organization_invites').onDelete('CASCADE')
      table.string('status').defaultTo('pending')
      table.integer('attempts').defaultTo(0)
      table.timestamp('next_attempt_at').nullable()
      table.text('last_error').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable('invite_send_jobs')
  }
}
