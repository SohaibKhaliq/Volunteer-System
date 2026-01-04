import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateShiftsTables extends BaseSchema {
  protected tableName = 'shifts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.integer('event_id').unsigned().nullable().index()
      table.timestamp('start_at', { useTz: false }).nullable()
      table.timestamp('end_at', { useTz: false }).nullable()
      table.integer('capacity').defaultTo(0)
      table.boolean('is_recurring').defaultTo(false)
      table.string('recurrence_rule').nullable()
      table.string('template_name').nullable()
      table.boolean('locked').defaultTo(false)
      table.integer('organization_id').unsigned().nullable().index()
      table.timestamp('created_at', { useTz: false }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: false }).defaultTo(this.now())
    })

    this.schema.createTable('shift_tasks', (table) => {
      table.increments('id')
      table.integer('shift_id').unsigned().notNullable().index()
      table.string('title').notNullable()
      table.text('description').nullable()
      table.integer('required_volunteers').defaultTo(1)
      table.string('difficulty').nullable()
      table.text('skills').nullable()
      table.timestamp('created_at', { useTz: false }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: false }).defaultTo(this.now())
    })

    this.schema.createTable('shift_assignments', (table) => {
      table.increments('id')
      table.integer('shift_id').unsigned().notNullable().index()
      table.integer('task_id').unsigned().nullable().index()
      table.integer('user_id').unsigned().notNullable().index()
      table.integer('assigned_by').unsigned().nullable()
      table.string('status').nullable()
      table.timestamp('checked_in_at', { useTz: false }).nullable()
      table.timestamp('checked_out_at', { useTz: false }).nullable()
      table.float('hours').nullable()
      table.timestamp('created_at', { useTz: false }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: false }).defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTableIfExists('shift_assignments')
    this.schema.dropTableIfExists('shift_tasks')
    this.schema.dropTableIfExists(this.tableName)
  }
}
