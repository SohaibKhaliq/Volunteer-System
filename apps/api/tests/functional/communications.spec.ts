import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Organization communications scheduling', (group) => {
  group.teardown(async () => {
    await Database.rawQuery('DELETE FROM communications')
    await Database.rawQuery('DELETE FROM organization_team_members')
    await Database.rawQuery('DELETE FROM organizations')
    await Database.rawQuery('DELETE FROM users')
  })

  test('sending a communication schedules it for background sending', async ({ client }) => {
    const sender = await User.create({ email: 'sender@test', password: 'pass' })
    const org = await Organization.create({ name: 'CommOrg' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: sender.id,
      role: 'Admin'
    })

    // create recipients and attach as organization volunteers
    const target = await User.create({ email: 'target1@test', password: 'pass' })
    await Database.from('organization_volunteers').insert({
      organization_id: org.id,
      user_id: target.id,
      role: 'volunteer',
      status: 'active'
    })

    const resp = await client
      .loginAs(sender)
      .post(`/organization/communications/send`)
      .json({ recipients: [target.id], subject: 'Hello', message: 'World', type: 'email' })

    resp.assertStatus(201)
    const body = resp.body()
    test.assert(body.communication)
    test.assert(body.communication.status === 'Scheduled')
    test.assert(body.communication.sendAt || body.communication.send_at)
  })

  test('broadcast schedules a communication for background sending', async ({ client }) => {
    const sender = await User.create({ email: 'bcast-sender@test', password: 'pass' })
    const org = await Organization.create({ name: 'BroadcastOrg' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: sender.id,
      role: 'Admin'
    })

    const resp = await client
      .loginAs(sender)
      .post(`/organization/communications/broadcast`)
      .json({ subject: 'Broadcast', message: 'Hello everyone', type: 'notification' })

    resp.assertStatus(201)
    const body = resp.body()
    test.assert(body.communication)
    test.assert(body.communication.status === 'Scheduled')
    test.assert(body.communication.sendAt || body.communication.send_at)
  })

  test('processing scheduled communications updates status and creates logs', async ({
    client
  }) => {
    // create a scheduled communication in the past
    const sender = await User.create({ email: 'proc@test', password: 'pass' })
    const org = await Organization.create({ name: 'ProcessOrg' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: sender.id,
      role: 'Admin'
    })
    const target = await User.create({ email: 'proc-target@test', password: 'pass' })
    await Database.from('organization_volunteers').insert({
      organization_id: org.id,
      user_id: target.id,
      role: 'volunteer',
      status: 'active'
    })

    const { DateTime } = await import('luxon')
    const Communication = await import('App/Models/Communication')
    const comm = await Communication.default.create({
      organizationId: org.id,
      senderId: sender.id,
      type: 'email',
      subject: 'Proc test',
      message: 'Hello',
      recipients: [target.email],
      status: 'Scheduled',
      sendAt: DateTime.local().minus({ minutes: 5 })
    })

    // call processDue exported by the service
    const svc = await import('App/Services/CommunicationSender')
    await svc.processDue()

    // reload comm
    const reloaded = await Communication.default.find(comm.id)
    test.assert(reloaded && (reloaded.status === 'Sent' || reloaded.status === 'Running'))

    // ensure a communication_log record exists
    const rows = await Database.from('communication_logs').where('communication_id', comm.id)
    test.assert(rows && rows.length >= 1)
  })
})
