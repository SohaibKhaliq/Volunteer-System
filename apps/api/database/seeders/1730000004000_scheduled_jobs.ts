import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import ScheduledJob from 'App/Models/ScheduledJob'
import { DateTime } from 'luxon'

export default class ScheduledJobsSeeder extends BaseSeeder {
  public async run() {
    console.info('ScheduledJobsSeeder disabled — using 000_all_australia_seeder instead')
    return
  }
}
