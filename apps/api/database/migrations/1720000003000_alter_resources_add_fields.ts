import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AlterResourcesAddFields extends BaseSchema {
  protected tableName = 'resources'

  public async up() {
    // Simplified SQLite/MySQL compatible migration using standard Knex
    const hasQuantityTotal = await this.schema.hasColumn(this.tableName, 'quantity_total')
    const hasQuantity = await this.schema.hasColumn(this.tableName, 'quantity')

    this.schema.alterTable(this.tableName, (table) => {
        if (!hasQuantityTotal && hasQuantity) {
             table.renameColumn('quantity', 'quantity_total')
        } else if (!hasQuantityTotal) {
             table.integer('quantity_total').defaultTo(0)
        }
    })

    // Check columns sequentially
    if (!(await this.schema.hasColumn(this.tableName, 'quantity_available'))) {
        this.schema.alterTable(this.tableName, (t) => t.integer('quantity_available').defaultTo(0))
    }
    if (!(await this.schema.hasColumn(this.tableName, 'category'))) {
        this.schema.alterTable(this.tableName, (t) => t.string('category').defaultTo('Other'))
    }
    if (!(await this.schema.hasColumn(this.tableName, 'description'))) {
        this.schema.alterTable(this.tableName, (t) => t.text('description').nullable())
    }
    if (!(await this.schema.hasColumn(this.tableName, 'location'))) {
        this.schema.alterTable(this.tableName, (t) => t.string('location').nullable())
    }
    if (!(await this.schema.hasColumn(this.tableName, 'serial_number'))) {
        this.schema.alterTable(this.tableName, (t) => t.string('serial_number').nullable())
    }
    if (!(await this.schema.hasColumn(this.tableName, 'maintenance_due'))) {
        this.schema.alterTable(this.tableName, (t) => t.timestamp('maintenance_due').nullable())
    }
    if (!(await this.schema.hasColumn(this.tableName, 'attributes'))) {
        this.schema.alterTable(this.tableName, (t) => t.json('attributes').nullable())
    }
  }

  public async down() {
     // Skip complex down logic for this hotfix
  }
}
