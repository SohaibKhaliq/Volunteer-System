import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EnsureJoinedAtExists extends BaseSchema {
  protected tableName = 'organization_volunteers'

  public async up() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'joined_at')
    if (!hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.timestamp('joined_at', { useTz: true }).defaultTo(this.now())
      })
    }
  }

  public async down() {
    // Only drop if we are sure we want to (usually risky in down, but fine for dev)
    const hasColumn = await this.schema.hasColumn(this.tableName, 'joined_at')
    if (hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('joined_at')
      })
    }
  }
}
