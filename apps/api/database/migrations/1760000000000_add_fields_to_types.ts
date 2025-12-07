import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'types'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('name').nullable()
      table.string('category').defaultTo('General')
      table.text('description').nullable()
    })

    // For any existing rows, populate `name` from the enum `type` (simple capitalization)
    // Use CONCAT + SUBSTRING pattern so it works on both MySQL and Postgres
    await Database.rawQuery(
      'UPDATE types SET name = CONCAT(UPPER(SUBSTRING(type,1,1)), LOWER(SUBSTRING(type,2))) WHERE name IS NULL'
    )
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('name')
      table.dropColumn('category')
      table.dropColumn('description')
    })
  }
}
