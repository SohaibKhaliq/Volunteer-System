import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'training_compliance_schema'

  public async up() {
    this.schema.createTable('courses', (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('instructor').nullable()
      table.timestamp('start_at', { useTz: true }).nullable()
      table.timestamp('end_at', { useTz: true }).nullable()
      table.integer('capacity').defaultTo(0)
      table.string('status').defaultTo('Open')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('course_enrollments', (table) => {
      table.increments('id')
      table.integer('course_id').unsigned().references('id').inTable('courses').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('status').defaultTo('enrolled')
      table.timestamp('enrolled_at', { useTz: true }).nullable()
      table.timestamp('completed_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['course_id', 'user_id'])
    })

    this.schema.createTable('background_checks', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('check_type').notNullable()
      table.string('status').defaultTo('pending')
      table.timestamp('issued_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.string('reference_number').nullable()
      table.text('notes').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('compliance_documents', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('document_type').notNullable()
      table.string('version').notNullable()
      table.boolean('is_required').defaultTo(true)
      table.boolean('is_active').defaultTo(true)
      table.text('content').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('compliance_requirements', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.string('requirement_type').notNullable()
      table.boolean('is_mandatory').defaultTo(true)
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable('compliance_requirements')
    this.schema.dropTable('compliance_documents')
    this.schema.dropTable('background_checks')
    this.schema.dropTable('course_enrollments')
    this.schema.dropTable('courses')
  }
}
