import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'operations_schema'

  public async up() {
    this.schema.createTable('tasks', (table) => {
      table.increments('id')
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.timestamp('start_at', { useTz: true }).nullable()
      table.timestamp('end_at', { useTz: true }).nullable()
      table.integer('slot_count').defaultTo(1)
      table.json('required_skills').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('assignments', (table) => {
      table.increments('id')
      table.integer('task_id').unsigned().references('id').inTable('tasks').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('status').defaultTo('assigned')
      table.integer('quantity').defaultTo(1)
      table.text('notes').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('resources', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('category').notNullable()
      table.text('description').nullable()
      table.integer('quantity_total').defaultTo(0)
      table.integer('quantity_available').defaultTo(0)
      table.string('location').nullable()
      table.string('serial_number').nullable()
      table.string('status').defaultTo('available')
      table.timestamp('maintenance_due', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('resource_assignments', (table) => {
      table.increments('id')
      table.integer('resource_id').unsigned().references('id').inTable('resources').onDelete('CASCADE')
      table.string('assignment_type').notNullable()
      table.integer('related_id').unsigned().nullable()
      table.timestamp('assigned_at', { useTz: true }).nullable()
      table.timestamp('expected_return_at', { useTz: true }).nullable()
      table.timestamp('returned_at', { useTz: true }).nullable()
      table.string('status').defaultTo('assigned')
      table.text('notes').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('shifts', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('event_id').unsigned().nullable().references('id').inTable('events').onDelete('SET NULL')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.timestamp('start_at', { useTz: true }).nullable()
      table.timestamp('end_at', { useTz: true }).nullable()
      table.integer('capacity').defaultTo(0)
      table.boolean('is_recurring').defaultTo(false)
      table.string('recurrence_rule').nullable()
      table.boolean('locked').defaultTo(false)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('shift_tasks', (table) => {
      table.increments('id')
      table.integer('shift_id').unsigned().references('id').inTable('shifts').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.integer('required_volunteers').defaultTo(1)
      table.string('difficulty').defaultTo('easy')
      table.string('skills').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('shift_assignments', (table) => {
      table.increments('id')
      table.integer('shift_id').unsigned().references('id').inTable('shifts').onDelete('CASCADE')
      table.integer('task_id').unsigned().nullable().references('id').inTable('shift_tasks').onDelete('SET NULL')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('assigned_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.string('status').defaultTo('scheduled')
      table.timestamp('checked_in_at', { useTz: true }).nullable()
      table.timestamp('checked_out_at', { useTz: true }).nullable()
      table.decimal('hours', 8, 2).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable('shift_assignments')
    this.schema.dropTable('shift_tasks')
    this.schema.dropTable('shifts')
    this.schema.dropTable('resource_assignments')
    this.schema.dropTable('resources')
    this.schema.dropTable('assignments')
    this.schema.dropTable('tasks')
  }
}
