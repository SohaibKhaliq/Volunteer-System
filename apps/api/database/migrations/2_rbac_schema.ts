import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'rbac_schema'

  public async up() {
    this.schema.createTable('roles', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.text('description').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('permissions', (table) => {
      table.increments('id')
      table.string('name').notNullable().unique()
      table.text('description').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.createTable('role_permissions', (table) => {
      table.increments('id')
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE')
      table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['role_id', 'permission_id'])
    })

    this.schema.createTable('user_roles', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['user_id', 'role_id'])
    })
  }

  public async down() {
    this.schema.dropTable('user_roles')
    this.schema.dropTable('role_permissions')
    this.schema.dropTable('permissions')
    this.schema.dropTable('roles')
  }
}
