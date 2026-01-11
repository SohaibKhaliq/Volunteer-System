import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableNameRooms = 'chat_rooms'
  protected tableNameMessages = 'messages'

  public async up () {
    this.schema.createTable(this.tableNameRooms, (table) => {
      table.increments('id')
      table.integer('organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('volunteer_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('resource_id').unsigned().nullable().references('id').inTable('resources').onDelete('SET NULL')
      
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Ensure unique chat per org-volunteer-resource context? 
      // Or maybe just org-volunteer? The prompt says "To link chat to a specific resource request (Optional)".
      // Let's index for faster lookups
      table.index(['organization_id', 'volunteer_id'])
    })

    this.schema.createTable(this.tableNameMessages, (table) => {
      table.increments('id')
      table.integer('room_id').unsigned().references('id').inTable('chat_rooms').onDelete('CASCADE')
      table.integer('sender_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.text('content')
      table.enum('type', ['text', 'system', 'return_request']).defaultTo('text')
      table.json('metadata').nullable()
      table.timestamp('read_at', { useTz: true }).nullable()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableNameMessages)
    this.schema.dropTable(this.tableNameRooms)
  }
}
