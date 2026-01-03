import { test } from '@japa/runner'
import User from 'App/Models/User'
import ScheduledJob from 'App/Models/ScheduledJob'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Scheduler service', (group) => {
  group.teardown(async () => {
    await Database.rawQuery('DELETE FROM scheduled_jobs')
    await Database.rawQuery('DELETE FROM notifications')
    await Database.rawQuery('DELETE FROM users')
  })

  test('processing due scheduled reminder creates notification and completes job', async ({
    assert
  }) => {
    const u = await User.create({ email: 'sched-user@test', password: 'pass' })

    const job = await ScheduledJob.create({
      name: 'remind user',
      type: 'reminder',
      status: 'Scheduled',
      payload: JSON.stringify({ userId: u.id, message: 'Friendly reminder' }),
      runAt: (await import('luxon')).DateTime.local().minus({ minutes: 5 })
    } as any)

    const svc = await import('App/Services/SchedulerService')
    await svc.processDue()

    const reloaded = await ScheduledJob.find(job.id)
    assert.isTrue(reloaded && reloaded.status === 'Completed')

    const notes = await Database.from('notifications').where('type', 'reminder')
    assert.isTrue(notes && notes.length >= 1)
  })
})
