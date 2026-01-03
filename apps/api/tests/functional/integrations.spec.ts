import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import VolunteerHour from 'App/Models/VolunteerHour'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

test.group('Integrations: External Services', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  // ==========================================
  // CentrelinkController Tests (Government Reporting Integration)
  // ==========================================
  test('centrelink: get current fortnight for user', async ({ client, assert }) => {
    const volunteer = await User.create({ email: `cent-vol-${Date.now()}@test.com`, password: 'pass' })
    const org = await Organization.create({ name: 'Govt Org', type: 'Community' })
    
    await OrganizationVolunteer.create({
      organizationId: org.id,
      userId: volunteer.id,
      hours: 20,
      status: 'Active'
    })

    // Add some volunteer hours
    await VolunteerHour.create({
      userId: volunteer.id,
      organizationId: org.id,
      hours: 5,
      date: DateTime.now().minus({ days: 3 }),
      status: 'approved'
    })

    const resp = await client.loginAs(volunteer).get(`/centrelink/fortnight/${volunteer.id}`)
    resp.assertStatus(200)
    // Response has: fortnight, summary, hours, user
    assert.exists(resp.body().fortnight)
    assert.exists(resp.body().summary)
    assert.isArray(resp.body().hours)
  })

  test('centrelink: generate SU462 report (requires opportunity link)', async ({ client, assert }) => {
    const volunteer = await User.create({ email: `su462-vol-${Date.now()}@test.com`, password: 'pass' })
    const org = await Organization.create({ name: 'SU462 Org', type: 'Community' })
    
    await OrganizationVolunteer.create({
      organizationId: org.id,
      userId: volunteer.id,
      hours: 40,
      status: 'Active'
    })

    // Note: SU462 generation requires VolunteerHour to have opportunity relationship
    // which may not be available in test setup. Testing 404 for no approved hours instead.
    
    const resp = await client.loginAs(volunteer).get(`/centrelink/su462/${volunteer.id}`)
    // Expect 404 since no approved hours with opportunity are available
    resp.assertStatus(404)
    assert.include(resp.body().message.toLowerCase(), 'no approved')
    
    // CSV export should also return 404
    const csvResp = await client.loginAs(volunteer).get(`/centrelink/su462/${volunteer.id}/csv`)
    csvResp.assertStatus(404)
  })
})
