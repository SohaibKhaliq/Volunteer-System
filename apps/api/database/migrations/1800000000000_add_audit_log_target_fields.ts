import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class AddAuditLogTargetFields extends BaseSchema {
  protected tableName = 'audit_logs'

  public async up() {
    const conn = Database.connection()

    // Check whether columns already exist and add only missing ones to keep migration idempotent
    const cols = [
      { name: 'target_type', type: 'string' },
      { name: 'target_id', type: 'integer' },
      { name: 'metadata', type: 'text' }
    ]

    try {
      for (const col of cols) {
        try {
          // Check information_schema
          const res: any = await conn.raw(
            `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [this.tableName, col.name]
          )

          let cnt = 0
          if (Array.isArray(res) && res[0]) {
            const rows = res[0]
            if (Array.isArray(rows) && rows.length > 0 && typeof rows[0].cnt !== 'undefined')
              cnt = Number(rows[0].cnt)
            else if (typeof rows.cnt !== 'undefined') cnt = Number(rows.cnt)
          } else if (
            res &&
            res.rows &&
            Array.isArray(res.rows) &&
            res.rows[0] &&
            typeof res.rows[0].cnt !== 'undefined'
          ) {
            cnt = Number(res.rows[0].cnt)
          }

          if (cnt === 0) {
            // add column (try raw alter first), fall back to schema helper if needed
            try {
              if (col.type === 'integer') {
                await conn.raw(
                  `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`${col.name}\` INT NULL`
                )
              } else if (col.type === 'text') {
                await conn.raw(
                  `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`${col.name}\` TEXT NULL`
                )
              } else {
                await conn.raw(
                  `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`${col.name}\` VARCHAR(255) NULL`
                )
              }
            } catch (rawErr) {
              // raw ALTER may not be available on some DBs — try schema helper
              try {
                await this.schema.alterTable(this.tableName, (table) => {
                  if (col.type === 'integer') table.integer(col.name).unsigned().nullable()
                  else if (col.type === 'text') table.text(col.name).nullable()
                  else table.string(col.name).nullable()
                })
              } catch (schemaErr) {
                const msg = String(schemaErr?.message || schemaErr || '')
                if (
                  msg.toLowerCase().includes('duplicate') ||
                  msg.toLowerCase().includes('already exists')
                ) {
                  // column already added by concurrent process — ignore
                } else {
                  throw schemaErr
                }
              }
            }
          }
        } catch (inner) {
          // best-effort: ignore a single column add failure and continue
          console.warn(`Skipping add for column ${col.name}: ${String(inner)}`)
        }
      }
    } catch (err) {
      console.error('Failed to ensure audit_log columns exist:', String(err))
      throw err
    }
  }

  public async down() {
    const conn = Database.connection()
    try {
      // best-effort drop columns
      try {
        await conn.raw(`ALTER TABLE \`${this.tableName}\` DROP COLUMN IF EXISTS \`target_type\``)
      } catch (_) {}
      try {
        await conn.raw(`ALTER TABLE \`${this.tableName}\` DROP COLUMN IF EXISTS \`target_id\``)
      } catch (_) {}
      try {
        await conn.raw(`ALTER TABLE \`${this.tableName}\` DROP COLUMN IF EXISTS \`metadata\``)
      } catch (_) {}
    } catch (err) {
      // ignore
    }
  }
}
