import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'engagement_schema'

  public async up() {
    this.schema.createTable('volunteer_hours', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')
      table.date('date').notNullable()
      table.decimal('hours', 8, 2).defaultTo(0)
      table.string('status').defaultTo('Pending')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('attendances', (table) => {
      table.increments('id')
      table.integer('opportunity_id').unsigned().references('id').inTable('opportunities').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('check_in_at', { useTz: true }).nullable()
      table.timestamp('check_out_at', { useTz: true }).nullable()
      table.string('method').defaultTo('manual')
      table.json('metadata').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('surveys', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.json('questions').nullable()
      table.string('status').defaultTo('draft')
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('survey_responses', (table) => {
      table.increments('id')
      table.integer('survey_id').unsigned().references('id').inTable('surveys').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.json('responses').nullable()
      table.timestamp('completed_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['survey_id', 'user_id'])
    })

    this.schema.createTable('achievements', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.string('category').notNullable()
      table.integer('points').defaultTo(0)
      table.string('icon').nullable()
      table.string('requirement_json').nullable() // Using string as seeder inserts simple strings
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('user_achievements', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('achievement_id').unsigned().references('id').inTable('achievements').onDelete('CASCADE')
      table.integer('progress').defaultTo(0)
      table.timestamp('unlocked_at', { useTz: true }).nullable()
      table.integer('granted_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.text('grant_reason').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['user_id', 'achievement_id'])
    })

    this.schema.createTable('gamification_badges', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.string('category').notNullable()
      table.integer('points').defaultTo(0)
      table.string('icon').nullable()
      table.json('criteria_json').nullable()
      table.string('rarity').defaultTo('common')
      table.boolean('is_active').defaultTo(true)
      table.integer('display_order').defaultTo(0)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('user_badges', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('badge_id').unsigned().references('id').inTable('gamification_badges').onDelete('CASCADE')
      table.timestamp('awarded_at', { useTz: true }).nullable()
      table.integer('awarded_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.text('award_reason').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['user_id', 'badge_id'])
    })
  }

  public async down() {
    this.schema.dropTable('user_badges')
    this.schema.dropTable('gamification_badges')
    this.schema.dropTable('user_achievements')
    this.schema.dropTable('achievements')
    this.schema.dropTable('survey_responses')
    this.schema.dropTable('surveys')
    this.schema.dropTable('attendances')
    this.schema.dropTable('volunteer_hours')
  }
}
