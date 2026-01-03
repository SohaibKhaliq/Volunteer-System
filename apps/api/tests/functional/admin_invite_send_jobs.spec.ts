import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationInvite from 'App/Models/OrganizationInvite'
import InviteSendJob from 'App/Models/InviteSendJob'

test.group('Admin invite send jobs endpoints', () => {
  test('unauthenticated access returns 401', async ({ client }) => {
    const response = await client.get('/admin/invite-send-jobs')
    response.assertStatus(401)
  })

  test('admin can list and retry jobs', async ({ client, assert }) => {
    const admin = await User.create({ email: `admin-jobs-${Date.now()}@test`, password: 'pass', isAdmin: true })

    const org = await Organization.create({ name: 'JobOrg' })
    const inviter = await User.create({ email: `inviter-job-${Date.now()}@test`, password: 'pass' })

    const invite = await OrganizationInvite.create({
      organizationId: org.id,
      email: `job-target-${Date.now()}@test`,
      token: `jobtoken-${Date.now()}`,
      status: 'pending',
      invitedBy: inviter.id
    })

    const job = await InviteSendJob.create({
      organizationInviteId: invite.id,
      status: 'failed',
      attempts: 3
    } as any)

    const resp = await client.loginAs(admin).get('/admin/invite-send-jobs')
    resp.assertStatus(200)
    const list = resp.body()
    const items = Array.isArray(list) ? list : list?.data || []
    assert.isArray(items)
    assert.isDefined(items.find((j: any) => j.id === job.id))

    // attempt retry
    const retryResp = await client.loginAs(admin).post(`/admin/invite-send-jobs/${job.id}/retry`)
    retryResp.assertStatus(200)
    await job.refresh()
    assert.equal(job.status, 'pending')
    assert.equal(job.attempts, 0)
  })

  test('filters and pagination work', async ({ client, assert }) => {
    const admin = await User.create({ email: `admin-jobs2-${Date.now()}@test`, password: 'pass', isAdmin: true })

    const org = await Organization.create({ name: 'JobOrg2' })
    const inviter = await User.create({ email: `inviter-job2-${Date.now()}@test`, password: 'pass' })

    // Create 5 invites and jobs, varied statuses and emails
    for (let i = 0; i < 5; i++) {
      const invite = await OrganizationInvite.create({
        organizationId: org.id,
        email: `target-${i}-${Date.now()}@example.test`,
        token: `token-${i}-${Date.now()}`,
        status: 'pending',
        invitedBy: inviter.id
      })
      await InviteSendJob.create({
        organizationInviteId: invite.id,
        status: i % 2 === 0 ? 'failed' : 'pending',
        attempts: i
      } as any)
    }

    // Query for failed jobs only, paginate perPage=1 page=2 (should return one item)
    const resp = await client
      .loginAs(admin)
      .get('/admin/invite-send-jobs?status=failed&perPage=1&page=2')
    resp.assertStatus(200)
    const body = resp.body()
    // paginated shape expected
    assert.isArray(body?.data)
    assert.isNumber(body?.meta?.total)
    assert.lengthOf(body.data, 1)

    // Search by email partial
    const resp2 = await client.loginAs(admin).get('/admin/invite-send-jobs?q=target-3')
    resp2.assertStatus(200)
    const body2 = resp2.body()
    const items2 = Array.isArray(body2) ? body2 : body2?.data || []
    assert.isAtLeast(items2.length, 1)
    assert.isTrue(items2.some((j: any) => j.invite?.email?.includes('target-3')))
  })
})
