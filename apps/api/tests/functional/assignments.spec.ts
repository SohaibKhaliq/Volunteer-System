import { test } from '@japa/runner'
import User from 'App/Models/User'
import Event from 'App/Models/Event'
import Task from 'App/Models/Task'
import Assignment from 'App/Models/Assignment'
import { DateTime } from 'luxon'

test.group('Assignments endpoints', () => {
  test('index can filter by user_id and preloads task.event', async ({ client, assert }) => {
    const u1 = await User.create({ email: 'assign1@test', password: 'pass' })
    const u2 = await User.create({ email: 'assign2@test', password: 'pass' })

    const ev = await Event.create({
      title: 'Assign Event',
      startAt: DateTime.now().plus({ days: 1 }).toJSDate()
    })
    const t1 = await Task.create({ eventId: ev.id, title: 'Task 1' })
    const t2 = await Task.create({ eventId: ev.id, title: 'Task 2' })

    await Assignment.create({ taskId: t1.id, userId: u1.id, status: 'accepted' })
    await Assignment.create({ taskId: t2.id, userId: u2.id, status: 'accepted' })

    const resp = await client.loginAs(u1).get(`/assignments?user_id=${u1.id}`)
    resp.assertStatus(200)

    const body = resp.body()
    assert.isArray(body)
    assert.isTrue(body.length >= 1)
    // all returned assignments belong to u1
    body.forEach((a: any) => assert.equal(a.userId || a.user?.id, u1.id))
    // task.event should be preloaded
    assert.isDefined(body[0].task)
    assert.isDefined(body[0].task.event)
  })
})
