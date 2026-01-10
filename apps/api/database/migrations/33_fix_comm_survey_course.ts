import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    // communications: add sender_id, category
    if (!(await this.schema.hasColumn('communications', 'sender_id'))) {
      this.schema.alterTable('communications', (table) => {
        table
          .integer('sender_id')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('users')
          .onDelete('SET NULL')
      })
    }
    if (!(await this.schema.hasColumn('communications', 'category'))) {
      this.schema.alterTable('communications', (table) => {
        table.string('category').nullable()
      })
    }

    // survey_responses: add answers
    if (!(await this.schema.hasColumn('survey_responses', 'answers'))) {
      this.schema.alterTable('survey_responses', (table) => {
        table.json('answers').nullable()
      })
    }

    // courses: add assign_all
    if (!(await this.schema.hasColumn('courses', 'assign_all'))) {
      this.schema.alterTable('courses', (table) => {
        table.boolean('assign_all').defaultTo(false)
      })
    }
  }

  public async down() {
    // Drop FK first to avoid MySQL errors when removing the column
    try {
      await this.db.raw(
        'ALTER TABLE `communications` DROP FOREIGN KEY `communications_sender_id_foreign`'
      )
    } catch (e) {
      console.log('Skipping sender_id FK drop:', e.message)
    }

    try {
      await this.db.raw('ALTER TABLE `communications` DROP COLUMN `sender_id`')
    } catch (e) {
      console.log('Skipping sender_id column drop:', e.message)
    }

    this.schema.alterTable('communications', (table) => {
      table.dropColumn('category')
    })
    this.schema.alterTable('survey_responses', (table) => {
      table.dropColumn('answers')
    })
    this.schema.alterTable('courses', (table) => {
      table.dropColumn('assign_all')
    })
  }
}
