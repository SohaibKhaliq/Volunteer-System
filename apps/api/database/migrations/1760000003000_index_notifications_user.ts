import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class IndexNotificationsUser extends BaseSchema {
  protected tableName = 'notifications'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['user_id'], 'notifications_user_id_idx')
      table.index(['user_id', 'read', 'created_at'], 'notifications_user_read_created_idx')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['user_id'], 'notifications_user_id_idx')
      table.dropIndex(['user_id', 'read', 'created_at'], 'notifications_user_read_created_idx')
    })
  }
}
