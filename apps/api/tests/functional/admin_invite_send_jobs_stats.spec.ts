import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationInvite from 'App/Models/OrganizationInvite'
import InviteSendJob from 'App/Models/InviteSendJob'

test.group('Admin invite send jobs stats endpoint', () => {
  test('unauthenticated returns 401', async ({ client }) => {
    const response = await client.get('/admin/invite-send-jobs/stats')
    response.assertStatus(401)
  })

  test('admin can fetch stats', async ({ client, assert }) => {
    const admin = await User.create({ email: `admin-stats-${Date.now()}@test`, password: 'pass', isAdmin: true })

    const org = await Organization.create({ name: 'StatsOrg' })
    const inviter = await User.create({ email: `inviter-stats-${Date.now()}@test`, password: 'pass' })

    // create jobs with varied statuses
    for (let i = 0; i < 6; i++) {
      const invite = await OrganizationInvite.create({
        organizationId: org.id,
        email: `s-${i}-${Date.now()}@test`,
        token: `t-${i}-${Date.now()}`,
        invitedBy: inviter.id
      })
      await InviteSendJob.create({
        organizationInviteId: invite.id,
        status: i % 3 === 0 ? 'sent' : i % 3 === 1 ? 'failed' : 'pending',
        attempts: i
      } as any)
    }

    const resp = await client.loginAs(admin).get('/admin/invite-send-jobs/stats')
    resp.assertStatus(200)
    const body = resp.body()
    assert.isNumber(body.total)
    assert.isNumber(body.successRate)
    assert.isObject(body.byStatus)
    assert.isAtLeast(body.total, 6)
  })
})
