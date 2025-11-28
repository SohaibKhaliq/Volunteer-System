import { test } from '@japa/runner'
import User from 'App/Models/User'
import AuditLog from 'App/Models/AuditLog'
import { AssignmentStatus } from 'App/Constants/assignmentStatus'
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

    await Assignment.create({ taskId: t1.id, userId: u1.id, status: AssignmentStatus.Accepted })
    await Assignment.create({ taskId: t2.id, userId: u2.id, status: AssignmentStatus.Accepted })

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

  test('update allows cancelling an assignment (status -> cancelled)', async ({
    client,
    assert
  }) => {
    const user = await User.create({ email: 'cancel@test', password: 'pass' })
    const ev = await Event.create({
      title: 'Cancel Event',
      startAt: DateTime.now().plus({ days: 3 }).toJSDate()
    })
    const t = await Task.create({ eventId: ev.id, title: 'Cancelable Task' })
    const a = await Assignment.create({
      taskId: t.id,
      userId: user.id,
      status: AssignmentStatus.Accepted
    })

    const resp = await client
      .loginAs(user)
      .put(`/assignments/${a.id}`)
      .json({ status: AssignmentStatus.Cancelled })
    resp.assertStatus(200)
    const b = resp.body()
    assert.equal(b.status, AssignmentStatus.Cancelled)

    // audit log should have been created
    const logs = await AuditLog.query()
      .where('action', 'assignment_cancelled')
      .andWhere('details', 'like', `%\"assignmentId\": ${a.id}%`)
    assert.isTrue(logs.length > 0)
  })
})
