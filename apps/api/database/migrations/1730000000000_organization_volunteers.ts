import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'organization_volunteers'

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
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      // Status and role
      table.string('status').defaultTo('Active')
      table.string('role').defaultTo('Volunteer')

      // Performance tracking
      table.integer('hours').defaultTo(0)
      table.float('rating').defaultTo(0)

      // Skills and metadata
      table.text('skills').nullable()
      table.text('notes').nullable()

      // When volunteer joined the organization
      table.timestamp('joined_at').defaultTo(this.now())

      // Timestamps
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Unique constraint - one user can only have one relationship per organization
      table.unique(['organization_id', 'user_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
