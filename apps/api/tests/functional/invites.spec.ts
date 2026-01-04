import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationInvite from 'App/Models/OrganizationInvite'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Organization invites - notifications', (group) => {
  group.teardown(async () => {
    // Delete in correct order to avoid FK constraints
    await Database.rawQuery('SET FOREIGN_KEY_CHECKS = 0')
    await Database.rawQuery('DELETE FROM notifications')
    await Database.rawQuery('DELETE FROM organization_invites')
    await Database.rawQuery('DELETE FROM volunteer_hours')
    await Database.rawQuery('DELETE FROM users')
    await Database.rawQuery('DELETE FROM organizations')
    await Database.rawQuery('SET FOREIGN_KEY_CHECKS = 1')
  })

  test('creating invite for existing user creates in-app notification', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'NotifyOrg' })
    const admin = await User.create({ email: 'inviter@test.com', password: 'pass', firstName: 'Inviter', lastName: 'User' })
    const target = await User.create({ email: 'target@test', password: 'pass', firstName: 'Target', lastName: 'User' })

    // act as inviter
    const resp = await client
      .loginAs(admin)
      .post(`/organizations/${org.id}/invites`)
      .json({ email: 'target@test', first_name: 'Target', last_name: 'User', role: 'volunteer' })

    resp.assertStatus(201)

    // ensure invite exists
    const inviteRow = await OrganizationInvite.query()
      .where('organization_id', org.id)
      .where('email', 'target@test')
      .first()
    assert.isNotNull(inviteRow)

    // ensure notification created for existing target user
    const notifs = await Database.from('notifications').where('user_id', target.id)
    assert.isTrue(Array.isArray(notifs) && notifs.length >= 1)
  })

  test('resend invite creates notification for existing user', async ({ client, assert }) => {
    const admin = await User.create({ email: 'resend-admin@test.com', password: 'pass', isAdmin: true, firstName: 'Test', lastName: 'User' })
    const org = await Organization.create({ name: 'ResendOrg' })
    const invite = await OrganizationInvite.create({
      organizationId: org.id,
      email: 'resend-target@test',
      firstName: 'R',
      lastName: 'Target',
      token: 'resendtoken',
      status: 'pending'
    })

    const target = await User.create({ email: 'resend-target@test', password: 'pass', firstName: 'Test', lastName: 'User' })

    const resp = await client
      .loginAs(admin)
      .post(`/organizations/${org.id}/invites/${invite.id}/resend`)
      .json()
    resp.assertStatus(200)

    // ensure notification exists for target
    const notifs = await Database.from('notifications').where('user_id', target.id)
    assert.isTrue(Array.isArray(notifs) && notifs.length >= 1)
  })
})
