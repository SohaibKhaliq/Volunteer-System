import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class EnsureNextMaintenanceAtExists extends BaseSchema {
  protected tableName = 'resources'

  public async up() {
    const conn = Database.connection()

    // Wrap the migration steps in a top-level try/catch so that DBs where
    // one or more columns already exist (or older servers that reject IF NOT EXISTS)
    // don't cause the whole migration to fail. Treat duplicate/already-exists
    // errors as a no-op.
    try {
      // Ensure the three resource maintenance columns exist.
      const cols = ['next_maintenance_at', 'last_maintenance_at', 'assigned_technician_id']

      // First, check which of the expected columns are actually missing.
      // Use SHOW COLUMNS which is supported across MySQL flavors and reliably
      // reports column presence. If none are missing, return early — this
      // keeps the migration idempotent and avoids any ALTER attempts.
      let missing: string[] = []
      try {
        for (const colName of cols) {
          let has = false
          try {
            // Prefer information_schema query because it is highly portable
            // and works across MySQL variants. Normalize response shapes.
            const info: any = await conn.raw(
              `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
              [this.tableName, colName]
            )

            if (Array.isArray(info) && info[0]) {
              const rows = info[0]
              if (Array.isArray(rows) && rows.length > 0 && typeof rows[0].cnt !== 'undefined') {
                has = Number(rows[0].cnt) > 0
              } else if (typeof rows.cnt !== 'undefined') {
                has = Number(rows.cnt) > 0
              }
            } else if (
              info &&
              info.rows &&
              Array.isArray(info.rows) &&
              info.rows[0] &&
              typeof info.rows[0].cnt !== 'undefined'
            ) {
              has = Number(info.rows[0].cnt) > 0
            }
          } catch (e) {
            // information_schema check failed or produced an unexpected shape;
            // we'll fall back to SHOW COLUMNS below.
          }

          if (!has) {
            try {
              const show: any = await conn.raw(`SHOW COLUMNS FROM \`${this.tableName}\` LIKE ?`, [
                colName
              ])
              if (Array.isArray(show) && show[0] && show[0].length && show[0].length > 0) {
                has = true
              } else if (show && show.rows && Array.isArray(show.rows) && show.rows.length > 0) {
                has = true
              }
            } catch (_) {
              // ignore SHOW COLUMNS failure — we'll treat the column as missing
              // and let subsequent best-effort adds handle it.
            }
          }

          if (!has) missing.push(colName)
        }
      } catch (e) {
        // If anything unexpected happened while checking, fall back to attempting
        // to add all columns in the best-effort section below.
        missing = cols.slice()
      }

      // Nothing to do — all columns already exist.
      if (missing.length === 0) {
        console.warn('Maintenance columns already exist on', this.tableName, '- skipping')
        return
      }

      try {
        for (const colName of missing) {
          // robust column existence check: information_schema first, then SHOW COLUMNS (MySQL),
          // so we avoid false negatives where a previous change already added the column.
          let exists = false
          try {
            const info: any = await conn.raw(
              `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
              [this.tableName, colName]
            )
            // parse shapes
            if (Array.isArray(info) && info[0]) {
              const rows = info[0]
              if (Array.isArray(rows) && rows.length > 0 && typeof rows[0].cnt !== 'undefined') {
                exists = Number(rows[0].cnt) > 0
              } else if (typeof rows.cnt !== 'undefined') {
                exists = Number(rows.cnt) > 0
              }
            } else if (
              info &&
              info.rows &&
              Array.isArray(info.rows) &&
              info.rows[0] &&
              typeof info.rows[0].cnt !== 'undefined'
            ) {
              exists = Number(info.rows[0].cnt) > 0
            }
          } catch (e) {
            // ignore info schema errors and try SHOW COLUMNS next
          }

          if (!exists) {
            try {
              const show: any = await conn.raw(`SHOW COLUMNS FROM \`${this.tableName}\` LIKE ?`, [
                colName
              ])
              if (Array.isArray(show) && show[0] && show[0].length && show[0].length > 0) {
                exists = true
              }
            } catch (e) {
              // ignore
            }
          }
          try {
            const qRes: any = await conn.raw(
              `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
              [this.tableName, colName]
            )

            // normalize driver shapes
            let cnt = 0
            if (Array.isArray(qRes) && qRes[0]) {
              const rows = qRes[0]
              if (Array.isArray(rows) && rows.length > 0 && typeof rows[0].cnt !== 'undefined') {
                cnt = Number(rows[0].cnt)
              } else if (typeof rows.cnt !== 'undefined') {
                cnt = Number(rows.cnt)
              }
            } else if (
              qRes &&
              qRes.rows &&
              Array.isArray(qRes.rows) &&
              qRes.rows[0] &&
              typeof qRes.rows[0].cnt !== 'undefined'
            ) {
              cnt = Number(qRes.rows[0].cnt)
            }

            if (!exists && cnt === 0) {
              // Add this missing column. Try raw ALTER with IF NOT EXISTS first
              // (supported by modern MySQL). If that fails (older DBs), fall
              // back to schema helper and ignore duplicate errors.
              try {
                if (colName === 'assigned_technician_id') {
                  await conn.raw(
                    `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`${colName}\` INT NULL`
                  )
                } else {
                  await conn.raw(
                    `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`${colName}\` TIMESTAMP NULL`
                  )
                }
              } catch (rawErr) {
                // if the raw ALTER isn't supported or returns a syntax error,
                // try schema helper. Ignore duplicate errors at either step.
                const rMsg = String(rawErr?.message || rawErr || '')
                if (
                  rMsg.toLowerCase().includes('duplicate') ||
                  rMsg.toLowerCase().includes('already exists')
                ) {
                  // target column already exists — move on
                } else {
                  try {
                    await this.schema.alterTable(this.tableName, (table) => {
                      if (colName === 'assigned_technician_id') {
                        table.integer('assigned_technician_id').unsigned().nullable()
                      } else {
                        table.timestamp(colName).nullable()
                      }
                    })
                  } catch (schemaErr) {
                    const sMsg = String(schemaErr?.message || schemaErr || '')
                    if (
                      sMsg.toLowerCase().includes('duplicate') ||
                      sMsg.toLowerCase().includes('already exists')
                    ) {
                      // another thread/process created the column — that's okay
                    } else {
                      // rethrow unknown errors from schema helper so outer block can
                      // handle best-effort retries
                      throw schemaErr
                    }
                  }
                }
              }
            }
          } catch (err) {
            // best-effort continue on errors per migration design
            console.warn(`Skipping check/add for column ${colName}: ${String(err)}`)
          }
        }

        // Try to add FK constraint for assigned_technician_id (best-effort)
        try {
          // use IF NOT EXISTS style where supported; otherwise best-effort and ignore duplicate FK errors
          await conn.raw(
            `ALTER TABLE \`${this.tableName}\` ADD CONSTRAINT fk_resources_assigned_technician FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL`
          )
        } catch (err) {
          // ignore errors here; the FK may already exist or DB doesn't allow it
        }
      } catch (e) {
        // overall failure: best-effort raw adds for each column individually to avoid duplicate errors
        // As a final best-effort fallback try to add any remaining missing columns
        // directly with raw SQL and ignore duplicate/exists errors.
        try {
          for (const colName of missing) {
            try {
              if (colName === 'assigned_technician_id') {
                await conn.raw(
                  `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`${colName}\` INT NULL`
                )
              } else {
                await conn.raw(
                  `ALTER TABLE \`${this.tableName}\` ADD COLUMN IF NOT EXISTS \`${colName}\` TIMESTAMP NULL`
                )
              }
            } catch (rawErr) {
              const msg = String(rawErr?.message || rawErr)
              if (
                msg.toLowerCase().includes('duplicate') ||
                msg.toLowerCase().includes('already exists')
              ) {
                // ignore duplicate column errors
              } else {
                // log and continue best-effort
                console.warn(`Failed to add column ${colName}: ${String(rawErr)}`)
              }
            }
          }

          // Try to add FK constraint for assigned_technician_id (best-effort)
          try {
            await conn.raw(
              `ALTER TABLE \`${this.tableName}\` ADD CONSTRAINT fk_resources_assigned_technician FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL`
            )
          } catch (fkErr) {
            // ignore errors here; best-effort only
          }
        } catch (finalErr) {
          console.error('Failed to ensure maintenance columns exist:', String(finalErr))
          throw finalErr
        }
      }
    } catch (err) {
      const msg = String(err?.message || err)
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already exists')) {
        console.warn('One or more maintenance columns already exist, skipping: ' + msg)
        return
      }
      throw err
    }
  }

  public async down() {
    const conn = Database.connection()
    try {
      // Try removing FK first (best-effort)
      try {
        await conn.raw(
          `ALTER TABLE \`${this.tableName}\` DROP FOREIGN KEY fk_resources_assigned_technician`
        )
      } catch (e) {}

      await this.schema.alterTable(this.tableName, (table) => {
        try {
          table.dropColumn('next_maintenance_at')
        } catch (e) {}
        try {
          table.dropColumn('last_maintenance_at')
        } catch (e) {}
        try {
          table.dropColumn('assigned_technician_id')
        } catch (e) {}
      })
    } catch (e) {
      // ignore
    }
  }
}
