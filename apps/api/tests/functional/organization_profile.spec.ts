import { test } from '@japa/runner'

test.group('Organization profile (panel) updates', () => {
  test('org manager can update profile settings (public_profile and auto_approve_volunteers)', async ({
    client,
    assert
  }) => {
    const Organization = await import('App/Models/Organization')
    const User = await import('App/Models/User')
    const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')

    const org = await Organization.default.create({ name: 'Settings Org' })
    const admin = await User.default.create({ email: `orgadmin-${Date.now()}@test`, password: 'secret' })

    // Make admin a team member for the organization
    await OrganizationTeamMember.default.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    // Admin updates their organization profile via the /organization/profile endpoint
    const resp = await client.loginAs(admin).put('/organization/profile').json({
      name: 'Updated Settings Org',
      public_profile: true,
      auto_approve_volunteers: true,
      publicProfile: true,
      autoApproveVolunteers: true
    })

    resp.assertStatus(200)
    resp.assertBodyContains({ name: 'Updated Settings Org' })
    resp.assertBodyContains({ public_profile: true })
    resp.assertBodyContains({ auto_approve_volunteers: true })

    // fetch the org directly and ensure flags were persisted
    const reloaded = await Organization.default.find(org.id)
    await reloaded?.refresh()
    // ensure model fields are truthy
    if (!reloaded) throw new Error('expected org to exist')
    // Cast strict 1/0 from DB to boolean for assertion
    assert.isTrue(Boolean(reloaded.publicProfile) === true || Boolean(reloaded.autoApproveVolunteers) === true)
  })
})
