import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AlterResourcesAddFields extends BaseSchema {
  protected tableName = 'resources'

  public async up() {
    // Rename existing `quantity` to `quantity_total` and add new columns
    // Use conditional checks to avoid duplicate column errors on repeated runs
    if (!(await this.schema.hasColumn(this.tableName, 'quantity_total'))) {
      if (await this.schema.hasColumn(this.tableName, 'quantity')) {
        await this.schema.alterTable(this.tableName, (table) => {
          table.renameColumn('quantity', 'quantity_total')
        })
      }
    }

    // Add columns only if they don't already exist
    if (!(await this.schema.hasColumn(this.tableName, 'quantity_available'))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.integer('quantity_available').defaultTo(0)
      })
    }

    if (!(await this.schema.hasColumn(this.tableName, 'category'))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.string('category').defaultTo('Other')
      })
    }

    if (!(await this.schema.hasColumn(this.tableName, 'description'))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.text('description').nullable()
      })
    }

    if (!(await this.schema.hasColumn(this.tableName, 'location'))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.string('location').nullable()
      })
    }

    if (!(await this.schema.hasColumn(this.tableName, 'serial_number'))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.string('serial_number').nullable()
      })
    }

    if (!(await this.schema.hasColumn(this.tableName, 'maintenance_due'))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.timestamp('maintenance_due', { useTz: true }).nullable()
      })
    }

    if (!(await this.schema.hasColumn(this.tableName, 'attributes'))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.json('attributes').nullable()
      })
    }

    // populate quantity_available from quantity_total for existing rows
    try {
      await this.schema.raw('UPDATE ?? SET ?? = ??', [
        this.tableName,
        'quantity_available',
        'quantity_total'
      ])
    } catch (e) {
      // fallback: try unquoted identifiers (some DBs differ)
      try {
        await this.schema.raw(`UPDATE ${this.tableName} SET quantity_available = quantity_total`)
      } catch (err) {
        // ignore if raw update fails
      }
    }

    // normalize statuses to lowercase for consistency (best-effort)
    try {
      await this.schema.raw(`UPDATE ${this.tableName} SET status = LOWER(status)`)
    } catch (e) {
      // ignore if fails
    }
  }

  public async down() {
    // reverse: remove added columns and rename quantity_total back to quantity if possible
    await this.schema.alterTable(this.tableName, (table) => {
      try {
        table.dropColumn('quantity_available')
      } catch (e) {}
      try {
        table.dropColumn('category')
      } catch (e) {}
      try {
        table.dropColumn('description')
      } catch (e) {}
      try {
        table.dropColumn('location')
      } catch (e) {}
      try {
        table.dropColumn('serial_number')
      } catch (e) {}
      try {
        table.dropColumn('maintenance_due')
      } catch (e) {}
      try {
        table.dropColumn('attributes')
      } catch (e) {}

      try {
        table.renameColumn('quantity_total', 'quantity')
      } catch (e) {
        // ignore if rename fails
      }
    })
  }
}
