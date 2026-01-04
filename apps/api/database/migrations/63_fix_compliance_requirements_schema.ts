import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    const hasTable = await this.schema.hasTable('compliance_requirements')
    if (!hasTable) {
      return
    }

    // Drop the table and recreate with correct schema matching the model
    this.schema.dropTableIfExists('compliance_requirements')
    
    this.schema.createTable('compliance_requirements', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().nullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('opportunity_id').unsigned().nullable().references('id').inTable('opportunities').onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('doc_type').notNullable() // matches model's docType
      table.text('description').nullable()
      table.boolean('is_mandatory').defaultTo(true) // matches model's isMandatory
      table.enum('enforcement_level', ['onboarding', 'signup', 'checkin']).notNullable() // matches model's enforcementLevel
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTableIfExists('compliance_requirements')
  }
}
