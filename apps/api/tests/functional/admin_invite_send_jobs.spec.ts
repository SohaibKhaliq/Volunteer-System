import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationInvite from 'App/Models/OrganizationInvite'
import InviteSendJob from 'App/Models/InviteSendJob'

test.group('Admin invite send jobs endpoints', () => {
  test('unauthenticated access returns 401', async ({ client }) => {
    await client.get('/admin/invite-send-jobs').assertStatus(401)
  })

  test('admin can list and retry jobs', async ({ client }) => {
    const admin = await User.create({ email: 'admin-jobs@test', password: 'pass', isAdmin: true })

    const org = await Organization.create({ name: 'JobOrg' })
    const inviter = await User.create({ email: 'inviter-job@test', password: 'pass' })

    const invite = await OrganizationInvite.create({
      organizationId: org.id,
      email: 'job-target@test',
      token: 'jobtoken',
      status: 'pending',
      invitedBy: inviter.id
    })

    const job = await InviteSendJob.create({ organizationInviteId: invite.id, status: 'failed', attempts: 3 } as any)

    const resp = await client.loginAs(admin).get('/admin/invite-send-jobs')
    resp.assertStatus(200)
    const list = resp.body()
    test.assert(Array.isArray(list))
    test.assert(list.find((j: any) => j.id === job.id) !== undefined)

    // attempt retry
    const retryResp = await client.loginAs(admin).post(`/admin/invite-send-jobs/${job.id}/retry`)
    retryResp.assertStatus(200)
    await job.refresh()
    test.assert(job.status === 'pending')
    test.assert(job.attempts === 0)
  })
})
