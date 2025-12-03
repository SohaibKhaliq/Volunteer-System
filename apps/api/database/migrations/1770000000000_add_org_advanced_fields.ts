import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddOrgAdvancedFields extends BaseSchema {
  protected tableName = 'organizations'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.string('slug').unique().nullable()
      table.string('timezone').defaultTo('UTC')
      table.json('settings').nullable()
      table.string('status').defaultTo('active') // active, suspended, archived
      table.json('billing_meta').nullable()
      table.string('city').nullable()
      table.string('country').nullable()
    })

    // Add index on slug for fast lookups
    this.schema.table(this.tableName, (table) => {
      table.index(['slug'])
      table.index(['status'])
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropIndex(['slug'])
      table.dropIndex(['status'])
      table.dropColumn('slug')
      table.dropColumn('timezone')
      table.dropColumn('settings')
      table.dropColumn('status')
      table.dropColumn('billing_meta')
      table.dropColumn('city')
      table.dropColumn('country')
    })
  }
}
