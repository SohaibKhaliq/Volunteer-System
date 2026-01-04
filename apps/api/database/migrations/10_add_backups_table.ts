
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'backups'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('backup_type').notNullable()
      table.integer('organization_id').unsigned().nullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('created_by').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('file_path').notNullable()
      table.bigInteger('file_size').defaultTo(0)
      table.string('status').defaultTo('creating')
      table.text('included_entities').nullable() // JSON
      table.text('metadata').nullable() // JSON
      
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
