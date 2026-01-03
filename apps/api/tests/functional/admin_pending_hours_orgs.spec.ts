import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Admin pending hours by organization', (group) => {
  test('unauthenticated returns 401', async ({ client }) => {
    const response = await client.get('/admin/pending-hours/organizations')
    response.assertStatus(401)
  })

  test('admin can fetch grouped pending hours', async ({ client, assert }) => {
    const admin = await User.create({ email: `admin-ph-${Date.now()}@test`, password: 'pass', isAdmin: true })
    const org1 = await Organization.create({ name: 'Org A' })
    const org2 = await Organization.create({ name: 'Org B' })

    const u1 = await User.create({ email: `v1-${Date.now()}@test`, password: 'pass' })
    const u2 = await User.create({ email: `v2-${Date.now()}@test`, password: 'pass' })

    await OrganizationVolunteer.create({ organizationId: org1.id, userId: u1.id, status: 'Active' })
    await OrganizationVolunteer.create({ organizationId: org2.id, userId: u2.id, status: 'Active' })

    await Database.table('volunteer_hours').insert({
      user_id: u1.id,
      status: 'pending',
      hours: 2,
      date: new Date()
    })
    await Database.table('volunteer_hours').insert({
      user_id: u2.id,
      status: 'pending',
      hours: 1,
      date: new Date()
    })

    const resp = await client.loginAs(admin).get('/admin/pending-hours/organizations')
    resp.assertStatus(200)
    const body = resp.body()
    assert.isArray(body)
    // should contain two organizations
    assert.isAtLeast(body.length, 2)
    assert.isTrue(body.some((g: any) => g.organizationName === 'Org A'))
  })
})
