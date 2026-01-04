import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'communications_logs_schema'

  public async up() {
    this.schema.createTable('communications', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('sent_by').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()
      table.string('type').notNullable()
      table.string('category').notNullable()
      table.string('subject').notNullable()
      table.text('body').nullable()
      table.string('status').defaultTo('sent')
      table.timestamp('sent_at', { useTz: true }).nullable()
      table.timestamp('delivered_at', { useTz: true }).nullable()
      table.timestamp('read_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('communication_logs', (table) => {
      table.increments('id')
      table.integer('communication_id').unsigned().references('id').inTable('communications').onDelete('CASCADE')
      table.string('activity_type').notNullable()
      table.text('activity_details').nullable()
      table.string('ip_address').nullable()
      table.string('user_agent').nullable()
      table.timestamp('occurred_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('engagement_campaigns', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.string('campaign_type').notNullable()
      table.timestamp('start_date', { useTz: true }).nullable()
      table.timestamp('end_date', { useTz: true }).nullable()
      table.string('target_audience').defaultTo('all_volunteers')
      table.integer('goal_metric').defaultTo(0)
      table.integer('current_metric').defaultTo(0)
      table.string('status').defaultTo('scheduled')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('notifications', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('title').notNullable()
      table.string('type').notNullable()
      table.json('payload').nullable()
      table.boolean('read').defaultTo(false)
      table.string('priority').defaultTo('normal')
      table.string('category').nullable()
      table.string('action_url').nullable()
      table.string('action_text').nullable()
      table.boolean('sent_via_email').defaultTo(false)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('audit_logs', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('action').notNullable()
      table.string('entity_type').notNullable()
      table.integer('entity_id').unsigned().nullable()
      table.text('description').nullable()
      table.string('ip_address').nullable()
      table.string('user_agent').nullable()
      table.json('old_values').nullable()
      table.json('new_values').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('documents', (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('category').notNullable()
      table.string('file_path').notNullable()
      table.string('file_name').notNullable()
      table.string('file_type').notNullable()
      table.integer('file_size').defaultTo(0)
      table.boolean('requires_acknowledgment').defaultTo(false)
      table.boolean('is_public').defaultTo(false)
      table.string('version').defaultTo('1')
      table.string('status').defaultTo('draft')
      table.timestamp('published_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.json('metadata').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('document_acknowledgments', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('document_id').unsigned().references('id').inTable('documents').onDelete('CASCADE')
      table.timestamp('acknowledged_at', { useTz: true }).nullable()
      table.string('ip_address').nullable()
      table.string('user_agent').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['user_id', 'document_id'])
    })
  }

  public async down() {
    this.schema.dropTable('document_acknowledgments')
    this.schema.dropTable('documents')
    this.schema.dropTable('audit_logs')
    this.schema.dropTable('notifications')
    this.schema.dropTable('engagement_campaigns')
    this.schema.dropTable('communication_logs')
    this.schema.dropTable('communications')
  }
}
