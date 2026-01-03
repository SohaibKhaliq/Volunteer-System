import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationInvite from 'App/Models/OrganizationInvite'
import Database from '@ioc:Adonis/Lucid/Database'
import InviteSendJob from 'App/Models/InviteSendJob'

test.group('Admin invite send jobs bulk retry', () => {
  test('unauthenticated returns 401', async ({ client }) => {
    const response = await client.post('/admin/invite-send-jobs/retry-failed')
    response.assertStatus(401)
  })

  test('admin can retry all failed jobs', async ({ client, assert }) => {
    const admin = await User.create({ email: `admin-bulk-${Date.now()}@test`, password: 'pass', isAdmin: true })

    const org = await Organization.create({ name: 'BulkOrg' })
    const inviter = await User.create({ email: `inviter-bulk-${Date.now()}@test`, password: 'pass' })

    // create jobs with failed status
    const invites = [] as any[]
    for (let i = 0; i < 3; i++) {
        const invite = await OrganizationInvite.create({
        organizationId: org.id,
        email: `b-${i}-${Date.now()}@test`,
        token: `t-b-${i}-${Date.now()}`,
        invitedBy: inviter.id
      })
      invites.push(invite)
      await InviteSendJob.create({
        organizationInviteId: invite.id,
        status: 'failed',
        attempts: i + 1
      } as any)
    }

    const resp = await client.loginAs(admin).post('/admin/invite-send-jobs/retry-failed')
    resp.assertStatus(200)
    const body = resp.body()
    assert.isNumber(body.requeued)
    assert.isAtLeast(body.requeued, 3)

    // verify the jobs are now pending
    const jobs = await InviteSendJob.query().whereIn(
      'organization_invite_id',
      invites.map((i) => i.id)
    )
    for (const job of jobs) {
      // it might be pending or sent depending on if queue ran
      assert.oneOf(job.status, ['pending', 'sent'])
      // attempts count reset logic might vary if it ran already
      if (job.status === 'pending') {
        assert.equal(job.attempts, 0)
      }
    }

    // confirm audit logs were written
    const completed = await Database.from('audit_logs').where(
      'action',
      'invite_send_jobs_requeue_completed'
    )
    assert.isAtLeast(completed.length, 1)

    const started = await Database.from('audit_logs').where(
      'action',
      'invite_send_jobs_requeue_started'
    )
    assert.isAtLeast(started.length, 1)
    // ensure metadata contains count (toRequeueCount) and is >= 3
    if (started[0].metadata) {
      const meta = JSON.parse(started[0].metadata || '{}')
      assert.isAtLeast(Number(meta.toRequeueCount || 0), 3)
    }
  })
})
