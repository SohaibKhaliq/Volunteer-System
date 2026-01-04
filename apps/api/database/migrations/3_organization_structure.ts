import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'organization_structure_schema'

  public async up() {
    this.schema.createTable('teams', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.integer('lead_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('organization_volunteers', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('status').defaultTo('Pending')
      table.string('role').defaultTo('volunteer')
      table.integer('hours').defaultTo(0)
      table.decimal('rating', 3, 1).defaultTo(0)
      table.text('skills').nullable()
      table.text('notes').nullable()
      table.timestamp('joined_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['organization_id', 'user_id'])
    })

    this.schema.createTable('organization_invites', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('email').notNullable()
      table.string('role').defaultTo('volunteer')
      table.string('invite_code').notNullable()
      table.string('status').defaultTo('pending')
      table.integer('invited_by').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.timestamp('responded_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('organization_team_members', (table) => {
      table.increments('id')
      table.integer('team_id').unsigned().references('id').inTable('teams').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('role').defaultTo('volunteer')
      table.timestamp('joined_at', { useTz: true }).nullable()
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['team_id', 'user_id'])
    })
  }

  public async down() {
    this.schema.dropTable('organization_team_members')
    this.schema.dropTable('organization_invites')
    this.schema.dropTable('organization_volunteers')
    this.schema.dropTable('teams')
  }
}
