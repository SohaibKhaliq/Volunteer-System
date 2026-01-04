import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateBackups extends BaseSchema {
  protected tableName = 'backups'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Backup details
      table.string('backup_type', 50).notNullable() // 'full' | 'incremental' | 'organization'
      table.integer('organization_id').unsigned().nullable()
      table.integer('created_by').unsigned().notNullable()

      // File information
      table.string('file_path', 500).notNullable()
      table.bigInteger('file_size').notNullable() // bytes
      table.string('status', 50).notNullable().defaultTo('creating') // 'creating' | 'completed' | 'failed'

      // Backup content
      table.text('included_entities').nullable() // JSON array of entity types
      table.text('metadata').nullable() // Additional info (compression, encryption, etc.)

      // Timestamps
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Foreign keys
      table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE')
      table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE')

      // Indexes
      table.index(['backup_type'], 'backups_type_index')
      table.index(['organization_id'], 'backups_org_index')
      table.index(['created_by'], 'backups_creator_index')
      table.index(['created_at'], 'backups_created_at_index')
      table.index(['status'], 'backups_status_index')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
