import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableNameTeams = 'teams'
  protected tableNameChatRooms = 'chat_rooms'
  protected tableNameTeamRequirements = 'team_certification_requirements'

  public async up () {
    // 1. Update teams table
    this.schema.alterTable(this.tableNameTeams, (table) => {
      table.integer('capacity').nullable()
      table.boolean('min_requirements_enabled').defaultTo(false)
    })

    // 2. Update chat_rooms table
    this.schema.alterTable(this.tableNameChatRooms, (table) => {
      // Add team connection
      table.integer('team_id').unsigned().nullable().references('id').inTable('teams').onDelete('CASCADE')
      table.enum('type', ['direct', 'team', 'resource_related']).defaultTo('direct')
      
      // Ensure one chat room per team
      // Note: We might want to allow multiple, but the requirements imply "A Team Group Chat".
      // Let's enforce uniqueness for 'team' type rooms if team_id is present?
      // For now, simple index. Logic can enforce singleton.
      table.index(['team_id'])
    })

    // 3. Create team_certification_requirements table
    this.schema.createTable(this.tableNameTeamRequirements, (table) => {
      table.increments('id')
      table.integer('team_id').unsigned().references('id').inTable('teams').onDelete('CASCADE')
      table.integer('template_id').unsigned().references('id').inTable('certificate_templates').onDelete('CASCADE')
      
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Prevent duplicate requirements for same cert on same team
      table.unique(['team_id', 'template_id'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableNameTeamRequirements)

    this.schema.alterTable(this.tableNameChatRooms, (table) => {
      table.dropColumn('team_id')
      table.dropColumn('type')
    })

    this.schema.alterTable(this.tableNameTeams, (table) => {
      table.dropColumn('capacity')
      table.dropColumn('min_requirements_enabled')
    })
  }
}
