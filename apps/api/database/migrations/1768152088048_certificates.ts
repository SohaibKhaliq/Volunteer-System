import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'certificates'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('uuid').notNullable().unique().index()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('template_id').unsigned().references('id').inTable('certificate_templates').onDelete('RESTRICT')
      table.integer('module_id').unsigned().nullable().references('id').inTable('training_modules').onDelete('SET NULL')
      table.timestamp('issued_at', { useTz: true }).defaultTo(this.now())
      table.enum('status', ['active', 'revoked']).defaultTo('active')
      table.text('revocation_reason').nullable()

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
