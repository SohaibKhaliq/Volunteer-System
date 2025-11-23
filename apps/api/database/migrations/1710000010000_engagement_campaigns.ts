import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EngagementCampaigns extends BaseSchema {
  protected tableName = 'engagement_campaigns'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name')
      table.text('message')
      table.json('targets').nullable()
      table.boolean('sent').defaultTo(false)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
