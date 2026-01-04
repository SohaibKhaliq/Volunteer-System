import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // Check if table exists first
    const hasTable = await this.schema.hasTable('compliance_requirements')
    if (hasTable) {
      return
    }

    this.schema.createTable('compliance_requirements', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('opportunity_id').unsigned().nullable().references('id').inTable('opportunities').onDelete('CASCADE')
      table.string('type').notNullable() // e.g., 'background_check', 'training', 'certification'
      table.string('name').notNullable()
      table.text('description').nullable()
      table.boolean('is_required').defaultTo(true)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTableIfExists('compliance_requirements')
  }
}
