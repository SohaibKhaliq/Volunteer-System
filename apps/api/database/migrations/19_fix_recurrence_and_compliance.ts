import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'opportunities'

  public async up() {
    this.schema.alterTable('opportunities', (table) => {
      table.json('recurrence').nullable()
    })

    this.schema.alterTable('compliance_requirements', (table) => {
      table
        .integer('opportunity_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('opportunities')
        .onDelete('CASCADE')
    })
  }

  public async down() {
    if (await this.schema.hasTable('compliance_requirements')) {
      this.schema.alterTable('compliance_requirements', (table) => {
        table.dropColumn('opportunity_id')
      })
    }
    this.schema.alterTable('opportunities', (table) => {
      table.dropColumn('recurrence')
    })
  }
}
