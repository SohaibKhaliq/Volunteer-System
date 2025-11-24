import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import ScheduledJob from 'App/Models/ScheduledJob'
import { DateTime } from 'luxon'

export default class ScheduledJobsSeeder extends BaseSeeder {
  public async run() {
    await ScheduledJob.firstOrCreate(
      { name: 'Sample Communication' },
      {
        name: 'Sample Communication',
        type: 'communication',
        payload: JSON.stringify({
          subject: 'Welcome!',
          content: 'This is a scheduled message from seeder',
          type: 'Email',
          status: 'Scheduled',
          targetAudience: 'all'
        }),
        runAt: DateTime.local().plus({ minutes: 1 }),
        status: 'Scheduled'
      }
    )
  }
}
