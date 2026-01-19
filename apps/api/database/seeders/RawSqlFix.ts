import Database from '@ioc:Adonis/Lucid/Database'
import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'

export default class extends BaseSeeder {
  public async run () {
    try {
        await Database.rawQuery('DROP TABLE IF EXISTS team_certification_requirements')
        await Database.rawQuery('DROP TABLE IF EXISTS certificate_templates')
        await Database.rawQuery('ALTER TABLE certificates DROP COLUMN IF EXISTS file_path')
        await Database.rawQuery('ALTER TABLE certificates DROP COLUMN IF EXISTS file_name')
        await Database.rawQuery('ALTER TABLE certificates DROP COLUMN IF EXISTS file_type')
        await Database.rawQuery('ALTER TABLE certificates DROP COLUMN IF EXISTS recipient_type')
        await Database.rawQuery('ALTER TABLE certificates DROP COLUMN IF EXISTS template_id')
    } catch (e) {
        // Fallback for older MySQL versions
        try { await Database.rawQuery('DROP TABLE team_certification_requirements') } catch(ee) {}
        try { await Database.rawQuery('DROP TABLE certificate_templates') } catch(ee) {}
        try { await Database.rawQuery('ALTER TABLE certificates DROP COLUMN file_path') } catch(ee) {}
        try { await Database.rawQuery('ALTER TABLE certificates DROP COLUMN file_name') } catch(ee) {}
        try { await Database.rawQuery('ALTER TABLE certificates DROP COLUMN file_type') } catch(ee) {}
        try { await Database.rawQuery('ALTER TABLE certificates DROP COLUMN recipient_type') } catch(ee) {}
        try { await Database.rawQuery('ALTER TABLE certificates DROP COLUMN template_id') } catch(ee) {}
    }
  }
}
