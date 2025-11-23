import { test } from '@japa/runner'

test.group('Reports', () => {
  test('overview returns expected shape', async ({ client }) => {
    const response = await client.get('/reports')
    response.assertStatus(200)
    const body = response.body()

    // must include main report keys
    response.assertHasAllKeys([
      'volunteerParticipation',
      'eventCompletion',
      'volunteerHours',
      'organizationPerformance',
      'complianceAdherence',
      'predictions'
    ])
  })

  test('events endpoint returns per-event completion fields', async ({ client }) => {
    const response = await client.get('/reports?type=events')
    response.assertStatus(200)
    const body = response.body()
    // should be an array (could be empty)
    if (Array.isArray(body) && body.length > 0) {
      const ev = body[0]
      response.assertHasAllKeys([
        'id',
        'title',
        'location',
        'totalTasks',
        'completedTasks',
        'completionRate',
        'fullyCompleted'
      ])
    }
  })

  test('participation returns assignments-per-user list', async ({ client }) => {
    const response = await client.get('/reports?type=participation')
    response.assertStatus(200)
    const body = response.body()
    response.assertIsArray()
  })
})
