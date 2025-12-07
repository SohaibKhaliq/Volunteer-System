import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class EnsureNextMaintenanceAtExists extends BaseSchema {
  protected tableName = 'resources'

  public async up() {
    const conn = Database.connection()

    try {
      // Ensure the three resource maintenance columns exist.
      const cols = ['next_maintenance_at', 'last_maintenance_at', 'assigned_technician_id']

      for (const colName of cols) {
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

          if (cnt === 0) {
            // Add this missing column. Use schema helpers first, fallback to raw.
            try {
              await this.schema.alterTable(this.tableName, (table) => {
                if (colName === 'assigned_technician_id') {
                  table.integer('assigned_technician_id').unsigned().nullable()
                } else {
                  table.timestamp(colName).nullable()
                }
              })
            } catch (err) {
              // fallback raw
              if (colName === 'assigned_technician_id') {
                await conn.raw(
                  `ALTER TABLE \`${this.tableName}\` ADD COLUMN \`${colName}\` INT NULL`
                )
              } else {
                await conn.raw(
                  `ALTER TABLE \`${this.tableName}\` ADD COLUMN \`${colName}\` TIMESTAMP NULL`
                )
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
        await conn.raw(
          `ALTER TABLE \`${this.tableName}\` ADD CONSTRAINT fk_resources_assigned_technician FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL`
        )
      } catch (err) {
        // ignore errors here; the FK may already exist or DB doesn't allow it
      }
    } catch (e) {
      // overall failure: try a best-effort schema alter to add all columns
      try {
        await this.schema.alterTable(this.tableName, (table) => {
          table.timestamp('next_maintenance_at').nullable()
          table.timestamp('last_maintenance_at').nullable()
          table.integer('assigned_technician_id').unsigned().nullable()
        })
        try {
          await conn.raw(
            `ALTER TABLE \`${this.tableName}\` ADD CONSTRAINT fk_resources_assigned_technician FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL`
          )
        } catch (err) {}
      } catch (err2) {
        // fallback raw add for all three
        try {
          await conn.raw(
            `ALTER TABLE \`${this.tableName}\` ADD COLUMN \`next_maintenance_at\` TIMESTAMP NULL`
          )
          await conn.raw(
            `ALTER TABLE \`${this.tableName}\` ADD COLUMN \`last_maintenance_at\` TIMESTAMP NULL`
          )
          await conn.raw(
            `ALTER TABLE \`${this.tableName}\` ADD COLUMN \`assigned_technician_id\` INT NULL`
          )
          try {
            await conn.raw(
              `ALTER TABLE \`${this.tableName}\` ADD CONSTRAINT fk_resources_assigned_technician FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL`
            )
          } catch (err) {}
        } catch (err3) {
          console.error('Failed to ensure maintenance columns exist:', String(err3))
          throw err3
        }
      }
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
