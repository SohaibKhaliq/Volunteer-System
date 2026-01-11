import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'user_training_progress'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('module_id').unsigned().references('id').inTable('training_modules').onDelete('CASCADE')
      table.enum('status', ['in_progress', 'completed', 'failed']).defaultTo('in_progress')
      table.integer('score').nullable()
      table.timestamp('completed_at', { useTz: true }).nullable()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
