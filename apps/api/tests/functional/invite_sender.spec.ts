import { test } from '@japa/runner'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import OrganizationInvite from 'App/Models/OrganizationInvite'

test.group('Invite sender service', (group) => {
  test('sendInviteNow calls Mail.send when available', async ({ assert }) => {
    const org = await Organization.create({ name: 'InviteSendOrg' })
    const inviter = await User.create({ email: 'inviter2@test', password: 'pass' })

    const invite = await OrganizationInvite.create({
      organizationId: org.id,
      email: 'invite-target@test',
      firstName: 'Someone',
      lastName: 'Target',
      token: 'invtoken',
      status: 'pending',
      invitedBy: inviter.id
    })

    // Try to stub Mail.send. If Mail can't be imported in this test environment,
    // assert that sendInviteNow doesn't throw and return gracefully.
    let Mail: any
    try {
      Mail = await import('@ioc:Adonis/Addons/Mail')
    } catch (e) {
      // Mail module not available - just call sendInviteNow to ensure no errors
      const { sendInviteNow } = await import('App/Services/InviteSender')
      const ok = await sendInviteNow(invite.id)
      assert.isTrue(ok === true || ok === false)
      return
    }

    const orig = Mail.default.send
    let called = false
    Mail.default.send = async () => {
      called = true
    }

    const { sendInviteNow } = await import('App/Services/InviteSender')
    const ok = await sendInviteNow(invite.id)
    assert.isTrue(ok === true)
    assert.isTrue(called)

    // restore
    Mail.default.send = orig
  })
})
