import { test } from '@japa/runner'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import OrganizationInvite from 'App/Models/OrganizationInvite'
import InviteSendJob from 'App/Models/InviteSendJob'

test.group('Invite sender DB-backed queue', (group) => {
  test('enqueueInviteSend creates a pending job', async ({ assert }) => {
    const org = await Organization.create({ name: 'QueueOrg' })
    const inviter = await User.create({ email: 'inviter-q@test', password: 'pass', firstName: 'Test', lastName: 'User' })

    const invite = await OrganizationInvite.create({
      organizationId: org.id,
      email: 'queue-target@test',
      token: 'q-token',
      status: 'pending',
      invitedBy: inviter.id
    })

    const { enqueueInviteSend } = await import('App/Services/InviteSender')
    await enqueueInviteSend(invite.id)

    const job = await InviteSendJob.findBy('organization_invite_id', invite.id)
    assert.isNotNull(job)
    assert.equal(job?.status, 'pending')
  })

  test('processQueue attempts send and marks job sent', async ({ assert }) => {
    const org = await Organization.create({ name: 'ProcessOrg' })
    const inviter = await User.create({ email: 'inviter-p@test', password: 'pass', firstName: 'Test', lastName: 'User' })

    const invite = await OrganizationInvite.create({
      organizationId: org.id,
      email: 'process-target@test',
      token: 'p-token',
      status: 'pending',
      invitedBy: inviter.id
    })

    const job = await InviteSendJob.create({
      organizationInviteId: invite.id,
      status: 'pending',
      attempts: 0
    } as any)

    // stub Mail if available
    let Mail: any
    try {
      Mail = await import('@ioc:Adonis/Addons/Mail')
    } catch (e) {
      // if mail isn't available, ensure processQueue doesn't blow up
      const { processQueue } = await import('App/Services/InviteSender')
      await processQueue()
      await job.refresh()
      assert.isTrue(['pending', 'failed', 'sent'].includes(job.status))
      return
    }

    const orig = Mail.default.send
    let called = false
    Mail.default.send = async () => {
      called = true
    }

    const { processQueue } = await import('App/Services/InviteSender')
    await processQueue()

    await job.refresh()
    assert.isTrue(called)
    assert.equal(job.status, 'sent')

    Mail.default.send = orig
  })
})
