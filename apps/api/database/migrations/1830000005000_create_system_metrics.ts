import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateSystemMetrics extends BaseSchema {
  protected tableName = 'system_metrics'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Metric type (e.g., 'daily_users', 'daily_hours', 'org_growth')
      table.string('metric_type', 100).notNullable()

      // Date for the metric
      table.date('metric_date').notNullable()

      // Numeric value of the metric
      table.decimal('metric_value', 15, 2).notNullable()

      // Additional context as JSON
      table.text('metadata').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Indexes for efficient querying
      table.index(['metric_type'], 'system_metrics_type_index')
      table.index(['metric_date'], 'system_metrics_date_index')
      table.index(['metric_type', 'metric_date'], 'system_metrics_type_date_index')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
