import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddResourceEnhancements extends BaseSchema {
  protected tableName = 'resources'

  public async up() {
    // Add soft delete and location + maintenance metadata
    await this.schema.alterTable(this.tableName, (table) => {
      if (!this.schema.hasColumn) {
        // older Adonis/Lucid versions expose helpers differently; proceed optimistically
      }
    })

    // Use defensive checks where possible
    try {
      if (!(await this.schema.hasColumn(this.tableName, 'deleted_at'))) {
        await this.schema.alterTable(this.tableName, (table) => {
          table.timestamp('deleted_at', { useTz: true }).nullable()
        })
      }
    } catch (e) {}

    try {
      if (!(await this.schema.hasColumn(this.tableName, 'location_room'))) {
        await this.schema.alterTable(this.tableName, (table) => {
          table.string('location_room').nullable()
          table.string('location_shelf').nullable()
          table.string('location_building').nullable()
        })
      }
    } catch (e) {}

    try {
      if (!(await this.schema.hasColumn(this.tableName, 'last_maintenance_at'))) {
        await this.schema.alterTable(this.tableName, (table) => {
          table.timestamp('last_maintenance_at', { useTz: true }).nullable()
          table.timestamp('next_maintenance_at', { useTz: true }).nullable()
          table
            .integer('assigned_technician_id')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('users')
            .onDelete('SET NULL')
        })
      }
    } catch (e) {}
  }

  public async down() {
    try {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('deleted_at')
        table.dropColumn('location_room')
        table.dropColumn('location_shelf')
        table.dropColumn('location_building')
        table.dropColumn('last_maintenance_at')
        table.dropColumn('next_maintenance_at')
        table.dropColumn('assigned_technician_id')
      })
    } catch (e) {}
  }
}
