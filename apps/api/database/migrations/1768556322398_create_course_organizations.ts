import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'course_organizations'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('course_id').unsigned().references('id').inTable('courses').onDelete('CASCADE')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.unique(['course_id', 'organization_id'])
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
