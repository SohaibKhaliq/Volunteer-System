import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreatePermissionsAndFlags extends BaseSchema {
  protected tableName = ''

  public async up() {
    // Permissions table
    if (!(await this.schema.hasTable('permissions'))) {
      this.schema.createTable('permissions', (table) => {
        table.increments('id').primary()
        table.string('name').notNullable().unique()
        table.string('description')
        table.timestamps(true, true)
      })
    }

    // Role -> Permission pivot
    if (!(await this.schema.hasTable('role_permissions'))) {
      this.schema.createTable('role_permissions', (table) => {
        table.increments('id').primary()
        table
          .integer('role_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('roles')
          .onDelete('CASCADE')
        table
          .integer('permission_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('permissions')
          .onDelete('CASCADE')
        table.boolean('granted').notNullable().defaultTo(true)
        table.timestamps(true, true)
        table.unique(['role_id', 'permission_id'])
      })
    }

    // Role inheritance (parent_role -> child_role)
    if (!(await this.schema.hasTable('role_inheritances'))) {
      this.schema.createTable('role_inheritances', (table) => {
        table.increments('id').primary()
        table
          .integer('parent_role_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('roles')
          .onDelete('CASCADE')
        table
          .integer('child_role_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('roles')
          .onDelete('CASCADE')
        table.timestamps(true, true)
        table.unique(['parent_role_id', 'child_role_id'])
      })
    }

    // Feature flags
    if (!(await this.schema.hasTable('feature_flags'))) {
      this.schema.createTable('feature_flags', (table) => {
        table.increments('id').primary()
        table.string('key').notNullable().unique()
        table.string('description')
        table.boolean('enabled').notNullable().defaultTo(false)
        table.json('conditions') // optional JSON to define role/env overrides
        table.timestamps(true, true)
      })
    }
  }

  public async down() {
    this.schema.dropTableIfExists('feature_flags')
    this.schema.dropTableIfExists('role_inheritances')
    this.schema.dropTableIfExists('role_permissions')
    this.schema.dropTableIfExists('permissions')
  }
}
