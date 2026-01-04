import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'organization_invites'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Foreign keys
      table
        .integer('organization_id')
        .unsigned()
        .references('id')
        .inTable('organizations')
        .onDelete('CASCADE')
      table
        .integer('invited_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      // Invitee information
      table.string('email', 255).notNullable()
      table.string('first_name', 100).nullable()
      table.string('last_name', 100).nullable()

      // Invitation details
      table.string('role', 50).defaultTo('volunteer')
      table.string('status', 50).defaultTo('pending') // pending, accepted, rejected, expired, cancelled
      table.string('token', 255).notNullable().unique()

      // Optional message
      table.text('message').nullable()

      // Expiration
      table.timestamp('expires_at').notNullable()

      // When invitation was accepted/rejected
      table.timestamp('responded_at').nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Index for faster lookups
      table.index(['organization_id', 'email'])
      table.index(['token'])
      table.index(['status'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
