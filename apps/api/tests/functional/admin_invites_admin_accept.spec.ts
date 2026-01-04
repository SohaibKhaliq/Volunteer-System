import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationInvite from 'App/Models/OrganizationInvite'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Admin accept invite on behalf', (group) => {
  test('admin can accept invite for an existing user', async ({ client, assert }) => {
    const admin = await User.create({ email: `admin-accept-${Date.now()}@test`, password: 'pass', isAdmin: true, firstName: 'Test', lastName: 'User' })
    const org = await Organization.create({ name: 'Admin Accept Org' })
    const invite = await OrganizationInvite.create({
      organizationId: org.id,
      email: `target-${Date.now()}@test`,
      firstName: 'T',
      lastName: 'User',
      token: `admintok-${Date.now()}`,
      status: 'pending',
      invitedBy: admin.id
    })

    const target = await User.create({ email: `target-${Date.now()}@test`, password: 'pass', firstName: 'Test', lastName: 'User' })

    const resp = await client
      .loginAs(admin)
      .post(`/admin/organizations/${org.id}/invites/${invite.id}/accept`)
      .json({ userId: target.id })
    resp.assertStatus(200)

    // ensure volunteer row exists
    const row = await Database.from('organization_volunteers')
      .where('organization_id', org.id)
      .andWhere('user_id', target.id)
      .first()
    assert.isDefined(row)
  })
})
