import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddApprovalStatusToRequests extends BaseSchema {
  protected tableName = ''

  public async up() {
    this.schema.alterTable('help_requests', (table) => {
      table
        .enu('approval_status', ['pending', 'approved', 'rejected'])
        .notNullable()
        .defaultTo('pending')
      table.integer('approved_by').unsigned().nullable()
      table.timestamp('approved_at', { useTz: true }).nullable()
    })

    this.schema.alterTable('offers', (table) => {
      table
        .enu('approval_status', ['pending', 'approved', 'rejected'])
        .notNullable()
        .defaultTo('pending')
      table.integer('approved_by').unsigned().nullable()
      table.timestamp('approved_at', { useTz: true }).nullable()
    })

    this.schema.alterTable('carpooling_ads', (table) => {
      table
        .enu('approval_status', ['pending', 'approved', 'rejected'])
        .notNullable()
        .defaultTo('pending')
      table.integer('approved_by').unsigned().nullable()
      table.timestamp('approved_at', { useTz: true }).nullable()
    })
  }

  public async down() {
    this.schema.alterTable('help_requests', (table) => {
      table.dropColumn('approval_status')
      table.dropColumn('approved_by')
      table.dropColumn('approved_at')
    })

    this.schema.alterTable('offers', (table) => {
      table.dropColumn('approval_status')
      table.dropColumn('approved_by')
      table.dropColumn('approved_at')
    })

    this.schema.alterTable('carpooling_ads', (table) => {
      table.dropColumn('approval_status')
      table.dropColumn('approved_by')
      table.dropColumn('approved_at')
    })
  }
}
