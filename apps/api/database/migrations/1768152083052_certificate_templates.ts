import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'certificate_templates'

  public async up () {
    // Already created and now handled by refactor
  }

  public async down () {
    // No-op
  }
}
