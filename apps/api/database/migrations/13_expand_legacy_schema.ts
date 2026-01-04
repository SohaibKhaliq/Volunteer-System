
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'expand_legacy_schema'

  public async up() {
    this.schema.alterTable('help_requests', (table) => {
      table.string('case_id').nullable().index()
      table.boolean('consent_given').defaultTo(false)
      table.string('contact_method').defaultTo('phone')
      table.json('files').nullable()
      table.boolean('is_on_site').defaultTo(false)
      table.boolean('is_verified').defaultTo(false)
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      table.json('meta_data').nullable()
      table.string('severity').defaultTo('medium')
      table.renameColumn('contact_phone', 'phone')
      table.string('source').defaultTo('web')
      table.integer('urgency_score').defaultTo(0)
    })

    this.schema.alterTable('offers', (table) => {
      table.json('files').nullable()
      table.boolean('is_on_site').defaultTo(false)
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      table.renameColumn('contact_phone', 'phone')
      table.string('category').defaultTo('general').alter()
    })

    this.schema.alterTable('types', (table) => {
      table.string('type').index().nullable() 
    })
  }

  public async down() {
    this.schema.alterTable('help_requests', (table) => {
        table.dropColumn('case_id')
        table.dropColumn('consent_given')
        table.dropColumn('contact_method')
        table.dropColumn('files')
        table.dropColumn('is_on_site')
        table.dropColumn('is_verified')
        table.dropColumn('latitude')
        table.dropColumn('longitude')
        table.dropColumn('meta_data')
        table.dropColumn('source')
        table.dropColumn('urgency_score')
    })
    this.schema.alterTable('offers', (table) => {
        table.dropColumn('files')
        table.dropColumn('is_on_site')
        table.dropColumn('latitude')
        table.dropColumn('longitude')
    })
  }
}
