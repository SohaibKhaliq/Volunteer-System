
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'achievements'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add missing columns required by Achievement Model
      table.string('key').nullable().after('category') // Nullable for existing records, model generates it
      table.integer('organization_id').unsigned().nullable().references('id').inTable('organizations').onDelete('CASCADE').after('id')
      table.string('rule_type').nullable().after('requirement_json')
      table.string('badge_image_url').nullable().after('icon')
      table.boolean('is_milestone').defaultTo(false).after('rule_type')
      
      // Index for key lookups
      table.index(['key'])
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['key'])
      table.dropColumn('key')
      table.dropForeign('organization_id') // Drop FK first
      table.dropColumn('organization_id')
      table.dropColumn('rule_type')
      table.dropColumn('badge_image_url')
      table.dropColumn('is_milestone')
    })
  }
}
