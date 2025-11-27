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
    for (const r of rows) {
      if (!r.logo) continue
      const raw = String(r.logo)
      const filename = raw.split('/').pop()
      if (!filename) continue
      // desired path
      const destRel = `organizations/${filename}`
      const destFull = `${tmpRoot}/${destRel}`

      // detect existing candidate locations
      const cand1 = `${tmpRoot}/local/${filename}`
      const cand2 = `${tmpRoot}/${filename}`
      const cand3 = `${tmpRoot}/organizations/${filename}`

      let found: string | null = null
      for (const c of [cand3, cand1, cand2]) {
        if (fs.existsSync(c)) {
          found = c
          break
        }
      }

      if (!found) continue

      // move if necessary
      if (found !== destFull) {
        try {
          fs.renameSync(found, destFull)
        } catch (err) {
          this.logger.warn(`Failed to migrate logo file ${found} -> ${destFull}: ${String(err)}`)
          continue
        }
      }

      try {
        await Database.from('organizations').where('id', r.id).update({ logo: destRel })
        migrated++
      } catch (err) {
        this.logger.warn('Failed to update organization logo db value', err)
      }
    }

    this.logger.info(`Migrated ${migrated} organization logos to organizations/ path`)
  }
}
