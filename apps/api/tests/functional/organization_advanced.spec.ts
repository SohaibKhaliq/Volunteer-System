import { test } from '@japa/runner'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import Team from 'App/Models/Team'
import Opportunity from 'App/Models/Opportunity'
import Application from 'App/Models/Application'
import Attendance from 'App/Models/Attendance'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import { DateTime } from 'luxon'

test.group('Organization Teams', () => {
  test('unauthenticated request returns 401', async ({ client }) => {
    const resp = await client.get('/organization/teams')
    resp.assertStatus(401)
  })

  test('authenticated user not in org returns 404', async ({ client }) => {
    const user = await User.create({ email: 'noteam_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    const resp = await client.loginAs(user).get('/organization/teams')
    resp.assertStatus(404)
  })

  test('can list teams for organization', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'Teams Org' })
    const user = await User.create({ email: 'teamsuser_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: user.id,
      role: 'Admin'
    })

    await Team.create({ organizationId: org.id, name: 'Team A' })
    await Team.create({ organizationId: org.id, name: 'Team B' })

    const resp = await client.loginAs(user).get('/organization/teams')
    resp.assertStatus(200)
    const body = resp.body()
    // Should return teams (may be paginated)
    const teams = body.data || body
    assert.isArray(teams)
    assert.isTrue(teams.length >= 2)
  })

  test('can create a team', async ({ client }) => {
    const org = await Organization.create({ name: 'Create Team Org' })
    const user = await User.create({ email: 'createteam_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: user.id,
      role: 'Admin'
    })

    const resp = await client
      .loginAs(user)
      .post('/organization/teams')
      .json({ name: 'New Team', description: 'Test team description' })

    resp.assertStatus(201)
    resp.assertBodyContains({ name: 'New Team', organization_id: org.id })
  })

  test('can update a team', async ({ client }) => {
    const org = await Organization.create({ name: 'Update Team Org' })
    const user = await User.create({ email: 'updateteam_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: user.id,
      role: 'Admin'
    })

    const team = await Team.create({
      organizationId: org.id,
      name: 'Original Name'
    })

    const resp = await client
      .loginAs(user)
      .put(`/organization/teams/${team.id}`)
      .json({ name: 'Updated Name' })

    resp.assertStatus(200)
    resp.assertBodyContains({ name: 'Updated Name' })
  })

  test('can delete a team', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'Delete Team Org' })
    const user = await User.create({ email: 'deleteteam_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: user.id,
      role: 'Admin'
    })

    const team = await Team.create({
      organizationId: org.id,
      name: 'To Delete'
    })

    const resp = await client.loginAs(user).delete(`/organization/teams/${team.id}`)
    resp.assertStatus(204)

    // Verify deleted
    const deleted = await Team.find(team.id)
    assert.isNull(deleted)
  })
})

test.group('Organization Opportunities', () => {
  test('can list opportunities for organization', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'Opportunities Org' })
    const user = await User.create({ email: 'oppuser_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: user.id,
      role: 'Admin'
    })

    await Opportunity.create({
      organizationId: org.id,
      title: 'Test Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'draft',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    const resp = await client.loginAs(user).get('/organization/opportunities')
    resp.assertStatus(200)
    const body = resp.body()
    const opps = body.data || body
    assert.isArray(opps)
    assert.isTrue(opps.length >= 1)
  })

  test('can create an opportunity', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'Create Opp Org' })
    const user = await User.create({ email: 'createopp_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: user.id,
      role: 'Admin'
    })

    const startAt = DateTime.now().plus({ days: 7 }).toISO()

    const resp = await client.loginAs(user).post('/organization/opportunities').json({
      title: 'New Opportunity',
      description: 'Test opportunity',
      start_at: startAt,
      capacity: 20,
      type: 'event',
      visibility: 'public'
    })

    resp.assertStatus(201)
    resp.assertBodyContains({ title: 'New Opportunity', organization_id: org.id })
    // Should have a slug generated
    const body = resp.body()
    assert.isTrue(body.slug && body.slug.length > 0)
  })

  test('can publish/unpublish an opportunity', async ({ client }) => {
    const org = await Organization.create({ name: 'Publish Opp Org' })
    const user = await User.create({ email: 'publishopp_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: user.id,
      role: 'Admin'
    })

    const opp = await Opportunity.create({
      organizationId: org.id,
      title: 'Draft Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'draft',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    // Publish
    const publishResp = await client
      .loginAs(user)
      .post(`/organization/opportunities/${opp.id}/publish`)
      .json({ publish: true })

    publishResp.assertStatus(200)
    publishResp.assertBodyContains({ opportunity: { status: 'published' } })

    // Unpublish
    const unpublishResp = await client
      .loginAs(user)
      .post(`/organization/opportunities/${opp.id}/publish`)
      .json({ publish: false })

    unpublishResp.assertStatus(200)
    unpublishResp.assertBodyContains({ opportunity: { status: 'draft' } })
  })
})

test.group('Opportunity Applications', () => {
  test('volunteer can apply to published opportunity', async ({ client }) => {
    const org = await Organization.create({ name: 'Apply Org' })
    const admin = await User.create({ email: 'applyadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const opp = await Opportunity.create({
      organizationId: org.id,
      title: 'Published Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'published',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    const volunteer = await User.create({ email: 'applyvolunteer_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })

    const resp = await client
      .loginAs(volunteer)
      .post(`/opportunities/${opp.id}/apply`)
      .json({ notes: 'I want to volunteer!' })

    resp.assertStatus(201)
    resp.assertBodyContains({ message: 'Application submitted successfully' })
    resp.assertBodyContains({ application: { status: 'applied' } })
  })

  test('cannot apply to draft opportunity', async ({ client }) => {
    const org = await Organization.create({ name: 'Draft Apply Org' })
    const admin = await User.create({ email: 'draftapplyadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const opp = await Opportunity.create({
      organizationId: org.id,
      title: 'Draft Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'draft',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    const volunteer = await User.create({ email: 'draftvolunteer_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })

    const resp = await client.loginAs(volunteer).post(`/opportunities/${opp.id}/apply`)
    resp.assertStatus(400)
    resp.assertBodyContains({ message: 'Cannot apply to unpublished opportunity' })
  })

  test('cannot apply twice to same opportunity', async ({ client }) => {
    const org = await Organization.create({ name: 'Double Apply Org' })
    const admin = await User.create({ email: 'doubleapplyadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const opp = await Opportunity.create({
      organizationId: org.id,
      title: 'Double Apply Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'published',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    const volunteer = await User.create({ email: 'doublevolunteer_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })

    // First application
    await client.loginAs(volunteer).post(`/opportunities/${opp.id}/apply`)

    // Second application should fail
    const resp = await client.loginAs(volunteer).post(`/opportunities/${opp.id}/apply`)
    resp.assertStatus(409)
    resp.assertBodyContains({ message: 'You have already applied to this opportunity' })
  })

  test('admin can accept/reject applications', async ({ client }) => {
    const org = await Organization.create({ name: 'Accept Reject Org' })
    const admin = await User.create({ email: 'acceptrejectadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const opp = await Opportunity.create({
      organizationId: org.id,
      title: 'Accept Reject Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'published',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    const volunteer = await User.create({ email: 'acceptrejectvolunteer_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })

    // Create application
    const application = await Application.create({
      opportunityId: opp.id,
      userId: volunteer.id,
      status: 'applied',
      appliedAt: DateTime.now()
    })

    // Accept
    const acceptResp = await client
      .loginAs(admin)
      .patch(`/organization/applications/${application.id}`)
      .json({ status: 'accepted' })

    acceptResp.assertStatus(200)
    acceptResp.assertBodyContains({ application: { status: 'accepted' } })
  })

  test('volunteer can withdraw their application', async ({ client }) => {
    const org = await Organization.create({ name: 'Withdraw Org' })
    const admin = await User.create({ email: 'withdrawadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const opp = await Opportunity.create({
      organizationId: org.id,
      title: 'Withdraw Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'published',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    const volunteer = await User.create({ email: 'withdrawvolunteer_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })

    const application = await Application.create({
      opportunityId: opp.id,
      userId: volunteer.id,
      status: 'applied',
      appliedAt: DateTime.now()
    })

    const resp = await client.loginAs(volunteer).delete(`/applications/${application.id}`)
    resp.assertStatus(200)
    resp.assertBodyContains({ message: 'Application withdrawn' })
  })
})

test.group('Opportunity Attendance', () => {
  test('accepted volunteer can check in', async ({ client }) => {
    const org = await Organization.create({ name: 'Checkin Org' })
    const admin = await User.create({ email: 'checkinadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const opp = await Opportunity.create({
      organizationId: org.id,
      title: 'Checkin Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'published',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    const volunteer = await User.create({ email: 'checkinvolunteer_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })

    // Create accepted application
    await Application.create({
      opportunityId: opp.id,
      userId: volunteer.id,
      status: 'accepted',
      appliedAt: DateTime.now()
    })

    const resp = await client
      .loginAs(volunteer)
      .post(`/opportunities/${opp.id}/checkin`)
      .json({ method: 'manual' })

    resp.assertStatus(201)
    resp.assertBodyContains({ message: 'Checked in successfully' })
    resp.assertBodyContains({ attendance: { method: 'manual' } })
  })

  test('cannot check in without accepted application', async ({ client }) => {
    const org = await Organization.create({ name: 'No Accept Org' })
    const admin = await User.create({ email: 'noacceptadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const opp = await Opportunity.create({
      organizationId: org.id,
      title: 'No Accept Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'published',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    const volunteer = await User.create({ email: 'noacceptvolunteer_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })

    const resp = await client.loginAs(volunteer).post(`/opportunities/${opp.id}/checkin`)
    resp.assertStatus(403)
    resp.assertBodyContains({ message: 'You must have an accepted application to check in' })
  })

  test('checked in volunteer can check out', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'Checkout Org' })
    const admin = await User.create({ email: 'checkoutadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const opp = await Opportunity.create({
      organizationId: org.id,
      title: 'Checkout Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'published',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    const volunteer = await User.create({ email: 'checkoutvolunteer_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })

    // Create accepted application
    await Application.create({
      opportunityId: opp.id,
      userId: volunteer.id,
      status: 'accepted',
      appliedAt: DateTime.now()
    })

    // Create check-in
    await Attendance.create({
      opportunityId: opp.id,
      userId: volunteer.id,
      checkInAt: DateTime.now(),
      method: 'manual'
    })

    const resp = await client.loginAs(volunteer).post(`/opportunities/${opp.id}/checkout`)
    resp.assertStatus(200)
    resp.assertBodyContains({ message: 'Checked out successfully' })
    // Should have duration_hours
    const body = resp.body()
    assert.isTrue('duration_hours' in body)
  })
})

test.group('Organization Settings', () => {
  test('can get organization settings', async ({ client }) => {
    const org = await Organization.create({
      name: 'Settings Org',
      timezone: 'America/New_York',
      status: 'active'
    })
    const user = await User.create({ email: 'settingsuser_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: user.id,
      role: 'Admin'
    })

    const resp = await client.loginAs(user).get('/organization/settings')
    resp.assertStatus(200)
    resp.assertBodyContains({
      id: org.id,
      timezone: 'America/New_York',
      status: 'active'
    })
  })

  test('admin can update organization settings', async ({ client }) => {
    const org = await Organization.create({
      name: 'Update Settings Org',
      timezone: 'UTC',
      status: 'active'
    })
    const user = await User.create({ email: 'updatesettings_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: user.id,
      role: 'Admin'
    })

    const resp = await client.loginAs(user).patch('/organization/settings').json({
      timezone: 'Europe/London',
      auto_approve_volunteers: true
    })

    resp.assertStatus(200)
    resp.assertBodyContains({
      timezone: 'Europe/London',
      autoApproveVolunteers: true
    })
  })

  test('non-admin cannot update settings', async ({ client }) => {
    const org = await Organization.create({
      name: 'No Admin Settings Org',
      timezone: 'UTC'
    })
    const user = await User.create({ email: 'noadminsettings_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: user.id,
      role: 'Member'
    })

    const resp = await client
      .loginAs(user)
      .patch('/organization/settings')
      .json({ timezone: 'Asia/Tokyo' })

    resp.assertStatus(403)
    resp.assertBodyContains({ message: 'You do not have permission to update settings' })
  })
})

test.group('Phase 2 - QR Code Check-in', () => {
  test('can generate check-in code for opportunity', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'QR Code Org' })
    const admin = await User.create({ email: 'qradmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const opp = await Opportunity.create({
      organizationId: org.id,
      title: 'QR Test Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'published',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    const resp = await client
      .loginAs(admin)
      .post(`/organization/opportunities/${opp.id}/generate-checkin-code`)

    resp.assertStatus(200)
    resp.assertBodyContains({ message: 'Check-in code generated successfully' })
    const body = resp.body()
    assert.isTrue(body.checkinCode && body.checkinCode.length > 0)
    assert.isTrue(body.qrData && body.qrData.opportunityId === opp.id)
  })

  test('volunteer can check in via QR code', async ({ client }) => {
    const org = await Organization.create({ name: 'QR Checkin Org' })
    const admin = await User.create({ email: 'qrcheckinadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const checkinCode = 'unique-qr-code-' + Date.now()
    const opp = await Opportunity.create({
      organizationId: org.id,
      title: 'QR Checkin Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'published',
      visibility: 'public',
      type: 'event',
      capacity: 10,
      checkinCode
    })

    const volunteer = await User.create({ email: 'qrvolunteer_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })

    await Application.create({
      opportunityId: opp.id,
      userId: volunteer.id,
      status: 'accepted',
      appliedAt: DateTime.now()
    })

    const resp = await client.loginAs(volunteer).post('/checkin/qr').json({ code: checkinCode })

    resp.assertStatus(201)
    resp.assertBodyContains({ message: 'Checked in successfully via QR code' })
  })
})

test.group('Phase 3 - CSV Export', () => {
  test('admin can export volunteers as CSV', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'Export Test Org' })
    const admin = await User.create({ email: 'exportadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const resp = await client.loginAs(admin).get('/organization/export/volunteers')

    resp.assertStatus(200)
    assert.match(resp.header('content-type'), /text\/csv/)
    const body = resp.text()
    assert.isTrue(body.includes('ID'))
    assert.isTrue(body.includes('Email'))
  })

  test('admin can export opportunities as CSV', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'Opp Export Org' })
    const admin = await User.create({ email: 'oppexportadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    await Opportunity.create({
      organizationId: org.id,
      title: 'Export Test Opp',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'published',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    const resp = await client.loginAs(admin).get('/organization/export/opportunities')

    resp.assertStatus(200)
    assert.match(resp.header('content-type'), /text\/csv/)
    const body = resp.text()
    assert.isTrue(body.includes('Title'))
    assert.isTrue(body.includes('Export Test Opp'))
  })

  test('non-admin cannot export data', async ({ client }) => {
    const org = await Organization.create({ name: 'No Export Org' })
    const member = await User.create({ email: 'noexport_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: member.id,
      role: 'Member'
    })

    const resp = await client.loginAs(member).get('/organization/export/volunteers')

    resp.assertStatus(403)
  })
})

test.group('Phase 3 - Reports & Analytics', () => {
  test('can get reports summary', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'Reports Org' })
    const admin = await User.create({ email: 'reportsadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const resp = await client.loginAs(admin).get('/organization/reports/summary')

    resp.assertStatus(200)
    const body = resp.body()
    assert.isTrue('volunteers' in body)
    assert.isTrue('hours' in body)
    assert.isTrue('opportunities' in body)
  })

  test('can get volunteer hours report', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'Hours Report Org' })
    const admin = await User.create({ email: 'hoursreportadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const resp = await client.loginAs(admin).get('/organization/reports/volunteer-hours')

    resp.assertStatus(200)
    const body = resp.body()
    assert.isTrue('trend' in body)
    assert.isTrue('topVolunteers' in body)
  })

  test('can get opportunity performance report', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'Perf Report Org' })
    const admin = await User.create({ email: 'perfreportadmin_' + Math.floor(Math.random() * 100000) + '@test', password: 'pass' })
    await OrganizationTeamMember.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    const resp = await client.loginAs(admin).get('/organization/reports/opportunity-performance')

    resp.assertStatus(200)
    const body = resp.body()
    assert.isTrue('opportunities' in body)
  })
})

test.group('Phase 3 - Public Organization Pages', () => {
  test('can list public organizations', async ({ client, assert }) => {
    await Organization.create({
      name: 'Public Org',
      slug: 'public-org-' + Date.now(),
      status: 'active',
      publicProfile: true
    })

    const resp = await client.get('/public/organizations')

    resp.assertStatus(200)
    const body = resp.body()
    assert.isTrue('data' in body)
    assert.isArray(body.data)
  })

  test('can get public organization by slug', async ({ client, assert }) => {
    const slug = 'public-detail-org-' + Date.now()
    await Organization.create({
      name: 'Public Detail Org',
      slug,
      status: 'active',
      publicProfile: true,
      description: 'A test organization'
    })

    const resp = await client.get(`/public/organizations/${slug}`)

    resp.assertStatus(200)
    const body = resp.body()
    assert.equal(body.name, 'Public Detail Org')
    assert.equal(body.slug, slug)
    assert.isTrue('stats' in body)
  })

  test('private organization returns 404', async ({ client }) => {
    const slug = 'private-org-' + Date.now()
    await Organization.create({
      name: 'Private Org',
      slug,
      status: 'active',
      publicProfile: false
    })

    const resp = await client.get(`/public/organizations/${slug}`)

    resp.assertStatus(404)
  })

  test('can get public opportunities for organization', async ({ client, assert }) => {
    const slug = 'opp-org-' + Date.now()
    const org = await Organization.create({
      name: 'Opp Org',
      slug,
      status: 'active',
      publicProfile: true
    })

    await Opportunity.create({
      organizationId: org.id,
      title: 'Public Opportunity',
      startAt: DateTime.now().plus({ days: 1 }),
      status: 'published',
      visibility: 'public',
      type: 'event',
      capacity: 10
    })

    const resp = await client.get(`/public/organizations/${slug}/opportunities`)

    resp.assertStatus(200)
    const body = resp.body()
    assert.isTrue('data' in body)
    assert.isTrue(body.data.length > 0)
    assert.equal(body.data[0].title, 'Public Opportunity')
  })
})
