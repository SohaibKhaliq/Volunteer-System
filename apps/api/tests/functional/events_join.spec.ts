import { test } from '@japa/runner'
import User from 'App/Models/User'
import Event from 'App/Models/Event'
import Task from 'App/Models/Task'
import Assignment from 'App/Models/Assignment'
import { DateTime } from 'luxon'

test.group('Event join flow', () => {
  test('authenticated user can join an event and create an assignment', async ({
    client,
    assert
  }) => {
    const user = await User.create({ email: 'joiner@test', password: 'pass' })
    const organizer = await User.create({ email: 'org@test', password: 'pass' })

    const event = await Event.create({
      title: 'Joinable Event',
      description: 'Event for join tests',
      startAt: DateTime.now().toSQL({ includeOffset: false }),
      organizationId: null
    })

    // create a task with 2 slots
    const task = await Task.create({ eventId: event.id, title: 'Main Task', slotCount: 2 })

    const response = await client.loginAs(user).post(`/events/${event.id}/join`)
    response.assertStatus(201)

    // confirm an assignment exists
    const assignment = await Assignment.query()
      .where('task_id', task.id)
      .where('user_id', user.id)
      .first()
    assert.isNotNull(assignment)
    assert.equal(assignment!.taskId, task.id)
    assert.equal(assignment!.userId, user.id)
    // assignment should use the accepted enum value
    assert.equal(assignment!.status, 'accepted')
  })
})
