import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationInvite from 'App/Models/OrganizationInvite'
import InviteSendJob from 'App/Models/InviteSendJob'

test.group('Admin invite send jobs stats endpoint', () => {
  test('unauthenticated returns 401', async ({ client }) => {
    await client.get('/admin/invite-send-jobs/stats').assertStatus(401)
  })

  test('admin can fetch stats', async ({ client }) => {
    const admin = await User.create({ email: 'admin-stats@test', password: 'pass', isAdmin: true })

    const org = await Organization.create({ name: 'StatsOrg' })
    const inviter = await User.create({ email: 'inviter-stats@test', password: 'pass' })

    // create jobs with varied statuses
    for (let i = 0; i < 6; i++) {
      const invite = await OrganizationInvite.create({
        organizationId: org.id,
        email: `s-${i}@test`,
        token: `t-${i}`,
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
    test.assert(typeof body.total === 'number')
    test.assert(typeof body.successRate === 'number')
    test.assert(typeof body.byStatus === 'object')
    test.assert(body.total >= 6)
  })
})
