import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AlterResourcesAddFields extends BaseSchema {
  protected tableName = 'resources'

  public async up() {
    try {
      // Manual introspection
      const [columns] = await this.schema.raw(`SHOW COLUMNS FROM \`${this.tableName}\``)
      // Debug log to understand state
      const columnNames = columns.map((c: any) => c.Field)
      console.log('DEBUG_MIGRATION: Existing columns:', columnNames)

      const hasQuantity = columnNames.includes('quantity')
      const hasQuantityTotal = columnNames.includes('quantity_total')

      // 1. Handle quantity -> quantity_total
      if (!hasQuantityTotal) {
        if (hasQuantity) {
          console.log('DEBUG_MIGRATION: Renaming quantity to quantity_total')
          try {
            await this.schema.raw(
              `ALTER TABLE \`${this.tableName}\` CHANGE COLUMN \`quantity\` \`quantity_total\` INT DEFAULT 0`
            )
          } catch (e) {
            console.warn('DEBUG_MIGRATION: Rename failed, checking if need to create', e.message)
            // If rename failed (e.g. unknown column despite check), just add new column
            try {
              await this.schema.raw(
                `ALTER TABLE \`${this.tableName}\` ADD COLUMN \`quantity_total\` INT DEFAULT 0`
              )
            } catch (ignored) {}
          }
        } else {
          console.log('DEBUG_MIGRATION: Creating quantity_total')
          await this.schema.raw(
            `ALTER TABLE \`${this.tableName}\` ADD COLUMN \`quantity_total\` INT DEFAULT 0`
          )
        }
      } else {
        console.log('DEBUG_MIGRATION: quantity_total already exists')
      }

      // 2. Add other columns safely
      const safeAdd = async (col: string, def: string) => {
        if (!columnNames.includes(col)) {
          console.log(`DEBUG_MIGRATION: Adding ${col}`)
          try {
            await this.schema.raw(`ALTER TABLE \`${this.tableName}\` ADD COLUMN \`${col}\` ${def}`)
          } catch (e) {
            console.warn(`DEBUG_MIGRATION: Failed to add ${col}`, e.message)
          }
        }
      }

      await safeAdd('quantity_available', 'INT DEFAULT 0')
      await safeAdd('category', "VARCHAR(255) DEFAULT 'Other'")
      await safeAdd('description', 'TEXT NULL')
      await safeAdd('location', 'VARCHAR(255) NULL')
      await safeAdd('serial_number', 'VARCHAR(255) NULL')
      await safeAdd('maintenance_due', 'TIMESTAMP NULL')
      await safeAdd('attributes', 'JSON NULL')

      // 3. Update data
      try {
        await this.schema.raw(`UPDATE ${this.tableName} SET quantity_available = quantity_total`)
      } catch (e) {
        console.warn('DEBUG_MIGRATION: Update quantity failed', e.message)
      }

      try {
        await this.schema.raw(`UPDATE ${this.tableName} SET status = LOWER(status)`)
      } catch (e) {
        console.warn('DEBUG_MIGRATION: Update status failed', e.message)
      }
    } catch (e) {
      console.error('DEBUG_MIGRATION: Fatal error in up()', e)
    }
  }

  public async down() {
    try {
      const [columns] = await this.schema.raw(`SHOW COLUMNS FROM \`${this.tableName}\``)
      const columnNames = columns.map((c: any) => c.Field)

      if (columnNames.includes('quantity_available'))
        await this.schema.raw(
          `ALTER TABLE \`${this.tableName}\` DROP COLUMN \`quantity_available\``
        )
      if (columnNames.includes('category'))
        await this.schema.raw(`ALTER TABLE \`${this.tableName}\` DROP COLUMN \`category\``)
      if (columnNames.includes('description'))
        await this.schema.raw(`ALTER TABLE \`${this.tableName}\` DROP COLUMN \`description\``)
      if (columnNames.includes('location'))
        await this.schema.raw(`ALTER TABLE \`${this.tableName}\` DROP COLUMN \`location\``)
      if (columnNames.includes('serial_number'))
        await this.schema.raw(`ALTER TABLE \`${this.tableName}\` DROP COLUMN \`serial_number\``)
      if (columnNames.includes('maintenance_due'))
        await this.schema.raw(`ALTER TABLE \`${this.tableName}\` DROP COLUMN \`maintenance_due\``)
      if (columnNames.includes('attributes'))
        await this.schema.raw(`ALTER TABLE \`${this.tableName}\` DROP COLUMN \`attributes\``)

      if (columnNames.includes('quantity_total') && !columnNames.includes('quantity')) {
        await this.schema.raw(
          `ALTER TABLE \`${this.tableName}\` CHANGE COLUMN \`quantity_total\` \`quantity\` INT DEFAULT 0`
        )
      }
    } catch (e) {
      console.error('DEBUG_MIGRATION: Fatal error in down()', e)
    }
  }
}
