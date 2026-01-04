
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('communication_logs', (table) => {
      // Add columns using standard builder. 
      // This ensures they run in the migration runner's transaction/connection context.
      table.string('recipient').nullable()
      table.string('status').defaultTo('pending')
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
    })

    this.schema.alterTable('communications', (table) => {
       // Modification using knex/lucid methods if possible, 
       // but modify default is tricky in pure knex sometimes.
       // We'll try raw inside the alterTable callback? No, that's not how it works.
       // We can use table.string('category').defaultTo('general').alter()
       table.string('category').defaultTo('general').alter()
    })
  }

  public async down() {
    // No-op
  }
}
