import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateDataOperations extends BaseSchema {
  protected tableName = 'data_operations'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Operation details
      table.string('operation_type', 50).notNullable() // 'import' | 'export' | 'backup'
      table.string('entity_type', 100).notNullable() // 'volunteers' | 'opportunities' | 'hours' | 'full_backup'
      table.string('format', 20).notNullable() // 'csv' | 'xlsx' | 'json'
      table.string('status', 50).notNullable().defaultTo('pending') // 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

      // Ownership
      table.integer('organization_id').unsigned().nullable()
      table.integer('user_id').unsigned().notNullable()

      // File handling
      table.string('file_path', 500).nullable()
      table.text('filters').nullable() // JSON filters for exports

      // Progress tracking
      table.integer('total_records').defaultTo(0)
      table.integer('processed_records').defaultTo(0)
      table.integer('failed_records').defaultTo(0)
      table.integer('progress').defaultTo(0) // 0-100

      // Error tracking
      table.text('errors').nullable() // JSON array of errors
      table.text('metadata').nullable() // Additional context

      // Timestamps
      table.timestamp('started_at', { useTz: true }).nullable()
      table.timestamp('completed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Foreign keys
      table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE')
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')

      // Indexes
      table.index(['status'], 'data_operations_status_index')
      table.index(['operation_type'], 'data_operations_type_index')
      table.index(['user_id'], 'data_operations_user_index')
      table.index(['organization_id'], 'data_operations_org_index')
      table.index(['created_at'], 'data_operations_created_at_index')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
