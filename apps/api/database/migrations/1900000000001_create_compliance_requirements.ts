import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'compliance_requirements'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Scoping
      table.integer('organization_id').unsigned().references('organizations.id').onDelete('CASCADE').nullable()
      table.integer('opportunity_id').unsigned().references('opportunities.id').onDelete('CASCADE').nullable()

      // Configuration
      table.string('name').notNullable()
      table.string('doc_type').notNullable() // Matches ComplianceDocument.doc_type
      table.text('description').nullable()
      
      // Enforcement
      table.boolean('is_mandatory').defaultTo(true)
      table.enum('enforcement_level', ['onboarding', 'signup', 'checkin']).defaultTo('signup')

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
