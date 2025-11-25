import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'organization_volunteers'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Foreign keys
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      // Organization-specific role
      table.string('role', 50).defaultTo('volunteer') // volunteer, coordinator, admin
      
      // Status
      table.string('status', 50).defaultTo('active') // active, inactive, pending
      
      // When volunteer joined the organization
      table.timestamp('joined_at').defaultTo(this.now())

      // Additional metadata
      table.text('notes').nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Unique constraint - one user can only have one relationship per organization
      table.unique(['organization_id', 'user_id'])
    })
  }

  public async down() {
  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('status').defaultTo('Active')
      table.string('role').defaultTo('Volunteer')
      table.integer('hours').defaultTo(0)
      table.float('rating').defaultTo(0)
      table.text('skills').nullable()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
