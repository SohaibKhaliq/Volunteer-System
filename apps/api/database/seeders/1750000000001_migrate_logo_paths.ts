import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'

export default class MigrateLogoPathsSeeder extends BaseSeeder {
  public async run() {
    const rows = await Database.from('organizations').select('id', 'logo')
    const tmpRoot = Application.tmpPath('uploads')
    if (!fs.existsSync(`${tmpRoot}/organizations`))
      fs.mkdirSync(`${tmpRoot}/organizations`, { recursive: true })

    let migrated = 0

    this.logger.info('migrate_logo_paths seeder disabled — all seeding consolidated')
    return
    this.logger.info(`Migrated ${migrated} organization logos to organizations/ path`)
  }
}
