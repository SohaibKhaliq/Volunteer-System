import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'certificates'

  public async up () {
    // 1. Drop dependent tables
    await this.schema.dropTableIfExists('team_certification_requirements')
    await this.schema.dropTableIfExists('certificate_templates')

    // 2. Refactor certificates table
    if (await this.schema.hasTable(this.tableName)) {
      const hasFilePath = await this.schema.hasColumn(this.tableName, 'file_path')
      const hasFileName = await this.schema.hasColumn(this.tableName, 'file_name')
      const hasFileType = await this.schema.hasColumn(this.tableName, 'file_type')
      const hasRecipientType = await this.schema.hasColumn(this.tableName, 'recipient_type')
      const hasRecipientOrg = await this.schema.hasColumn(this.tableName, 'recipient_organization_id')

      await this.schema.alterTable(this.tableName, (table) => {
        if (!hasFilePath) {
          table.string('file_path').notNullable().defaultTo('')
        }
        if (!hasFileName) {
          table.string('file_name').notNullable().defaultTo('')
        }
        if (!hasFileType) {
          table.string('file_type').nullable()
        }
        if (!hasRecipientType) {
          table.string('recipient_type').notNullable().defaultTo('volunteer')
        }
        if (!hasRecipientOrg) {
          table.integer('recipient_organization_id').unsigned().references('id').inTable('organizations').onDelete('CASCADE').nullable()
        }
        
        // Always try to alter user_id
        table.integer('user_id').unsigned().nullable().alter()
      })
    }
  }

  public async down () {
    // No-op
  }
}
