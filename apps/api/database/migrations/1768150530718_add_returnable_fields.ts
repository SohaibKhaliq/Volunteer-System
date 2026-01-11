import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('resources', (table) => {
      // Add flag to distinguish consumable vs returnable resources
      table.boolean('is_returnable').defaultTo(false).after('category')
    })

    this.schema.alterTable('resource_assignments', (table) => {
      // Add condition field for tracking asset state upon return
      table.string('condition').nullable().after('status')
    })
  }

  public async down() {
    this.schema.alterTable('resource_assignments', (table) => {
      table.dropColumn('condition')
    })

    this.schema.alterTable('resources', (table) => {
      table.dropColumn('is_returnable')
    })
  }
}
