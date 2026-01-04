
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'comprehensive_fix'

  public async up() {
    // 1. Create achievement_progress table
    if (!(await this.schema.hasTable('achievement_progress'))) {
      this.schema.createTable('achievement_progress', (table) => {
        table.increments('id')
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
        table.integer('achievement_id').unsigned().references('id').inTable('achievements').onDelete('CASCADE')
        table.integer('current_value').defaultTo(0)
        table.integer('target_value').defaultTo(100)
        table.integer('percentage').defaultTo(0)
        table.timestamp('last_evaluated_at', { useTz: true }).nullable()
        table.timestamp('created_at', { useTz: true })
        table.timestamp('updated_at', { useTz: true })
        table.unique(['user_id', 'achievement_id'])
      })
    }

    // 2. Add organization_id to volunteer_hours
    this.schema.alterTable('volunteer_hours', (table) => {
      table.integer('organization_id').unsigned().nullable().references('id').inTable('organizations').onDelete('CASCADE')
    })

    // 3. Fix Offers table (add email, rename title -> name)
    this.schema.alterTable('offers', (table) => {
      table.string('email').nullable()
      table.renameColumn('title', 'name')
    })

    // 4. Fix HelpRequests table (rename title -> name, add email if needed)
    this.schema.alterTable('help_requests', (table) => {
       table.renameColumn('title', 'name')
       // help_requests likely relies on user_id, but for symmetry/guest access adding email
       table.string('email').nullable()
    })
  }

  public async down() {
    // We won't strictly implement down for this fix migration as it involves data structure changes that are hard to reverse cleanly without data loss logic
    this.schema.dropTableIfExists('achievement_progress')
    this.schema.alterTable('volunteer_hours', (table) => {
        table.dropForeign(['organization_id'])
        table.dropColumn('organization_id')
    })
    this.schema.alterTable('offers', (table) => {
        table.dropColumn('email')
        table.renameColumn('name', 'title')
    })
     this.schema.alterTable('help_requests', (table) => {
        table.dropColumn('email')
        table.renameColumn('name', 'title')
    })
  }
}
