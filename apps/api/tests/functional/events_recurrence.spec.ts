import { test } from '@japa/runner'
import Event from 'App/Models/Event'
import { DateTime } from 'luxon'

test.group('Events Recurrence', () => {
  test('can create and retrieve recurring events', async ({ assert }) => {
    const event = await Event.create({
      title: 'Monthly Meeting',
      startAt: DateTime.now(),
      recurringRule: 'FREQ=MONTHLY;COUNT=12', 
      isRecurring: true,
      isPublished: true
    })

    const refreshed = await Event.find(event.id)
    assert.isNotNull(refreshed)
    assert.equal(refreshed!.recurringRule, 'FREQ=MONTHLY;COUNT=12')
    assert.isTrue(!!refreshed!.isRecurring)
  })
})
