import { test } from '@japa/runner'

test.group('Reports', () => {
  test('overview returns expected shape', async ({ client, assert }) => {
    const response = await client.get('/reports')
    response.assertStatus(200)
    const body = response.body()

    // must include main report keys
    assert.exists(body.volunteerParticipation)
    assert.exists(body.eventCompletion)
    assert.exists(body.volunteerHours)
    assert.exists(body.organizationPerformance)
    assert.exists(body.complianceAdherence)
    assert.exists(body.predictions)
  })

  test('events endpoint returns per-event completion fields', async ({ client, assert }) => {
    const response = await client.get('/reports?type=events')
    response.assertStatus(200)
    const body = response.body()
    // should be an array (could be empty)
    assert.isArray(body)
    if (body.length > 0) {
      const ev = body[0]
      assert.exists(ev.id)
      assert.exists(ev.title)
      assert.exists(ev.totalTasks)
      assert.exists(ev.completedTasks)
      assert.exists(ev.completionRate)
      assert.exists(ev.fullyCompleted)
    }
  })

  test('participation returns assignments-per-user list', async ({ client, assert }) => {
    const response = await client.get('/reports?type=participation')
    response.assertStatus(200)
    const body = response.body()
    assert.isArray(body)
  })
})
