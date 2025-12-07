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
      // Only run the populate query if the new `name` column was successfully added.
      try {
        const res: any = await Database.rawQuery(
          `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [this.tableName, 'name']
        )

        let cnt = 0
        if (Array.isArray(res) && res[0]) {
          const rows = res[0]
          if (Array.isArray(rows) && rows.length > 0 && typeof rows[0].cnt !== 'undefined') cnt = Number(rows[0].cnt)
          else if (typeof rows.cnt !== 'undefined') cnt = Number(rows.cnt)
        } else if (res && res.rows && Array.isArray(res.rows) && res.rows[0] && typeof res.rows[0].cnt !== 'undefined') {
          cnt = Number(res.rows[0].cnt)
        }

        if (cnt > 0) {
          await Database.rawQuery(
            "UPDATE types SET name = CONCAT(UPPER(SUBSTRING(type,1,1)), LOWER(SUBSTRING(type,2))) WHERE name IS NULL"
          )
        }
      } catch (e) {
        // best-effort: if the information_schema check fails, skip population rather than crash
        console.warn('Skipping types name population: ' + String(e))
      }
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('name')
      table.dropColumn('category')
      table.dropColumn('description')
    })
  }
}
