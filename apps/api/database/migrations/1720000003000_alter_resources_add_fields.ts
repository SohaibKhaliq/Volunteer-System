import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AlterResourcesAddFields extends BaseSchema {
  protected tableName = 'resources'

  public async up() {
    try {
      const hasQuantityTotal = await this.schema.hasColumn(this.tableName, 'quantity_total')
      const hasQuantity = await this.schema.hasColumn(this.tableName, 'quantity')

      // 1. Handle quantity -> quantity_total
      if (!hasQuantityTotal) {
        this.schema.alterTable(this.tableName, (table) => {
          table.integer('quantity_total').defaultTo(0)
        })

        if (hasQuantity) {
          // Defer data update to after column creation
          this.defer(async (db) => {
            await db.rawQuery(`UPDATE ${this.tableName} SET quantity_total = quantity`)
          })
        }
      }

      // 2. Add other columns safely
      if (!(await this.schema.hasColumn(this.tableName, 'quantity_available'))) {
        this.schema.alterTable(this.tableName, (table) => {
          table.integer('quantity_available').defaultTo(0)
        })
      }

      if (!(await this.schema.hasColumn(this.tableName, 'category'))) {
        this.schema.alterTable(this.tableName, (table) => {
          table.string('category').defaultTo('Other')
        })
      }

      if (!(await this.schema.hasColumn(this.tableName, 'description'))) {
        this.schema.alterTable(this.tableName, (table) => {
          table.text('description').nullable()
        })
      }

      if (!(await this.schema.hasColumn(this.tableName, 'location'))) {
        this.schema.alterTable(this.tableName, (table) => {
          table.string('location').nullable()
        })
      }

      if (!(await this.schema.hasColumn(this.tableName, 'serial_number'))) {
        this.schema.alterTable(this.tableName, (table) => {
          table.string('serial_number').nullable()
        })
      }

      if (!(await this.schema.hasColumn(this.tableName, 'maintenance_due'))) {
        this.schema.alterTable(this.tableName, (table) => {
          table.timestamp('maintenance_due').nullable()
        })
      }

      if (!(await this.schema.hasColumn(this.tableName, 'attributes'))) {
        this.schema.alterTable(this.tableName, (table) => {
          table.json('attributes').nullable()
        })
      }

      // 3. Update data (deferred)
      this.defer(async (db) => {
        try {
          await db.rawQuery(`UPDATE ${this.tableName} SET quantity_available = quantity_total`)
          await db.rawQuery(`UPDATE ${this.tableName} SET status = LOWER(status)`)
        } catch (e) {
          console.warn('Data update failed', e)
        }
      })
    } catch (e) {
      console.error('Fatal error in up()', e)
    }
  }

  public async down() {
    // simplified down
    const hasQuantityTotal = await this.schema.hasColumn(this.tableName, 'quantity_total')

    this.schema.alterTable(this.tableName, (table) => {
      if (hasQuantityTotal) table.dropColumn('quantity_total')
      table.dropColumn('quantity_available')
      table.dropColumn('category')
      table.dropColumn('description')
      table.dropColumn('location')
      table.dropColumn('serial_number')
      table.dropColumn('maintenance_due')
      table.dropColumn('attributes')
    })
  }
}
