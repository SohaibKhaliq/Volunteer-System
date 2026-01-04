import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EnhanceScheduledJobs extends BaseSchema {
  protected tableName = 'scheduled_jobs'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add metadata for progress tracking
      table.text('metadata').nullable()

      // Add completion timestamp
      table.timestamp('completed_at', { useTz: true }).nullable()

      // Rename last_error to error for clarity (if column exists)
      // Note: We'll keep both for backward compatibility
      table.text('error').nullable()

      // Add user tracking
      table.integer('user_id').unsigned().nullable()
      table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('metadata')
      table.dropColumn('completed_at')
      table.dropColumn('error')
      table.dropForeign(['user_id'])
      table.dropColumn('user_id')
    })
  }
}
