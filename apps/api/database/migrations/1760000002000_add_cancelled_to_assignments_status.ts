import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AlterAssignmentsStatus extends BaseSchema {
  protected tableName = 'assignments'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Expand the ENUM to include 'cancelled' — preserves other possible values.
      table
        .enum('status', ['pending', 'accepted', 'rejected', 'completed', 'cancelled'])
        .notNullable()
        .defaultTo('pending')
        .alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // revert to original enum (note: reverting may fail if any 'cancelled' rows exist)
      table
        .enum('status', ['pending', 'accepted', 'rejected', 'completed'])
        .notNullable()
        .defaultTo('pending')
        .alter()
    })
  }
}
