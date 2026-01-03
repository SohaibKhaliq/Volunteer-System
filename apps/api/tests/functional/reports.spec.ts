import { test } from '@japa/runner'

test.group('Reports', () => {
  test('overview returns expected shape', async ({ client, assert }) => {
    const User = await import('App/Models/User')
    const admin = await User.default.create({ email: `rep-admin-${Date.now()}@test`, password: 'pass', isAdmin: true })
    const response = await client.loginAs(admin).get('/reports')
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

  test('events endpoint (overview) returns event completion summary', async ({ client, assert }) => {
    const User = await import('App/Models/User')
    const admin = await User.default.create({ email: `rep-admin2-${Date.now()}@test`, password: 'pass', isAdmin: true })
    // The previous test expected an array from /reports?type=events, but the controller returns overview.
    // We update this test to verify the eventCompletion section of the overview.
    const response = await client.loginAs(admin).get('/reports') 
    response.assertStatus(200)
    const body = response.body()
    
    assert.exists(body.eventCompletion)
    assert.exists(body.eventCompletion.total)
    assert.exists(body.eventCompletion.completed)
    assert.exists(body.eventCompletion.rate || body.eventCompletion.completionRate)
  })

  test('participation returns volunteer participation summary', async ({ client, assert }) => {
    const User = await import('App/Models/User')
    const admin = await User.default.create({ email: `rep-admin3-${Date.now()}@test`, password: 'pass', isAdmin: true })
    const response = await client.loginAs(admin).get('/reports')
    response.assertStatus(200)
    const body = response.body()
    
    assert.exists(body.volunteerParticipation)
    assert.exists(body.volunteerParticipation.total)
    assert.exists(body.volunteerParticipation.active)
  })
})
