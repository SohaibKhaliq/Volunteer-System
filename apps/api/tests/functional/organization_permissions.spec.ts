import { test } from '@japa/runner'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'

test.group('Organization team permissions', () => {
  test('non-admin cannot invite members', async ({ client }) => {
    const org = await Organization.create({ name: 'Perms Org' })
    const admin = await User.create({ email: `admin-${Date.now()}@perms.test`, password: 'pass', firstName: 'Test', lastName: 'User' })
    const member = await User.create({ email: `member-${Date.now()}@perms.test`, password: 'pass', firstName: 'Test', lastName: 'User' })
    const newUser = await User.create({ email: `new-${Date.now()}@perms.test`, password: 'pass', firstName: 'Test', lastName: 'User' })

    await OrganizationTeamMember.create({ organizationId: org.id, userId: admin.id, role: 'Admin' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: member.id,
      role: 'Member'
    })

    // Member tries to invite -> forbidden
    const inviteResp = await client
      .loginAs(member)
      .post('/organization/team/invite')
      .json({ email: newUser.email, role: 'Member' })
    inviteResp.assertStatus(403)

    // Admin can invite
    const inviteResp2 = await client
      .loginAs(admin)
      .post('/organization/team/invite')
      .json({ email: newUser.email, role: 'Member' })
    inviteResp2.assertStatus(201)
  })

  test('non-admin cannot remove members', async ({ client }) => {
    const org = await Organization.create({ name: 'Remove Org' })
    const admin = await User.create({ email: `admin2-${Date.now()}@perms.test`, password: 'pass', firstName: 'Test', lastName: 'User' })
    const member = await User.create({ email: `member2-${Date.now()}@perms.test`, password: 'pass', firstName: 'Test', lastName: 'User' })
    const victim = await User.create({ email: `victim-${Date.now()}@perms.test`, password: 'pass', firstName: 'Test', lastName: 'User' })

    await OrganizationTeamMember.create({ organizationId: org.id, userId: admin.id, role: 'Admin' })
    const memberRec = await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: member.id,
      role: 'Member'
    })
    const victimRec = await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: victim.id,
      role: 'Member'
    })

    // Member attempts to delete another member -> forbidden
    const delResp = await client.loginAs(member).delete(`/organization/team/${victimRec.id}`)
    delResp.assertStatus(403)

    // Admin can delete
    const delResp2 = await client.loginAs(admin).delete(`/organization/team/${victimRec.id}`)
    delResp2.assertStatus(204)
  })
})
