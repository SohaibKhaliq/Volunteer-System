import { test } from '@japa/runner'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import Database from '@ioc:Adonis/Lucid/Database'
import Event from 'App/Models/Event'
import ComplianceDocument from 'App/Models/ComplianceDocument'
import { DateTime } from 'luxon'

test.group('Organization panel endpoints', () => {
  test('events: unauthenticated returns 401', async ({ client }) => {
    const resp = await client.get('/organization/events')
    resp.assertStatus(401)
  })

  test('events: authenticated but not part of org -> 404', async ({ client }) => {
    const u = await User.create({ email: `noorg-${Date.now()}@test`, password: 'pass' })
    const resp = await client.loginAs(u).get('/organization/events')
    resp.assertStatus(404)

    // attempt to create should also be rejected
    const eventsResp = await client
      .loginAs(u)
      .post('/organization/events')
      .json({ title: 'Unauth event', start_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss') })
    eventsResp.assertStatus(404)
  })

  test('events: scoped to organization member and can create', async ({ client, assert }) => {
    const orgA = await Organization.create({ name: 'Org A' })
    const orgB = await Organization.create({ name: 'Org B' })
    const user = await User.create({ email: `eventuser-${Date.now()}@test`, password: 'pass' })
    await OrganizationTeamMember.create({ organizationId: orgA.id, userId: user.id, role: 'Admin' })

    // create events across organizations
    await Event.create({
      title: 'Event A1',
      organizationId: orgA.id,
      startAt: DateTime.now().plus({ days: 5 })
    })
    await Event.create({
      title: 'Event B1',
      organizationId: orgB.id,
      startAt: DateTime.now().plus({ days: 2 })
    })

    const listResp = await client.loginAs(user).get('/organization/events')
    listResp.assertStatus(200)
    const listBody = listResp.body()
    // only events for orgA should be returned
    listBody.forEach((e: any) => {
      if (e.organizationId) assert.equal(e.organizationId, orgA.id)
    })

    // Create an event via POST (should be scoped to user's org)
    const createResp = await client
      .loginAs(user)
      .post('/organization/events')
      .json({ title: 'Created A', start_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss') })
    createResp.assertStatus(201)
    createResp.assertBodyContains({ organization_id: orgA.id })
  })

  test('volunteers: unauthenticated returns 401', async ({ client }) => {
    const resp = await client.get('/organization/volunteers')
    resp.assertStatus(401)
  })

  test('volunteers: scoped to organization member and can create', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'Vols Org' })
    const other = await Organization.create({ name: 'Other Org' })
    const admin = await User.create({ email: `voladmin-${Date.now()}@test`, password: 'pass' })
    await OrganizationTeamMember.create({ organizationId: org.id, userId: admin.id, role: 'Admin' })

    const u1 = await User.create({ email: `vol1-${Date.now()}@test`, password: 'pass' })
    const u2 = await User.create({ email: `vol2-${Date.now()}@test`, password: 'pass' })
    await OrganizationVolunteer.create({ organizationId: org.id, userId: u1.id, status: 'Active' })
    await OrganizationVolunteer.create({
      organizationId: other.id,
      userId: u2.id,
      status: 'Active'
    })

    const list = await client.loginAs(admin).get('/organization/volunteers')
    list.assertStatus(200)
    const body = list.body()
    // only volunteers from `org` should be present
    // check results
    assert.lengthOf(body, 1)
    assert.isTrue(body.some((v: any) => v.user_id === u1.id))
    assert.isFalse(body.some((v: any) => v.user_id === u2.id))

    // creating a volunteer should default to user's organization
    const createResp = await client
      .loginAs(admin)
      .post('/organization/volunteers')
      .json({ user_id: u2.id, status: 'Active' })
    createResp.assertStatus(201)
    createResp.assertBodyContains({ organizationId: org.id })
  })

  test('compliance stats: unauthenticated & not-part-of-org handling', async ({ client }) => {
    // unauthenticated
    const resp1 = await client.get('/organization/compliance/stats')
    resp1.assertStatus(401)

    // authenticated but not part of an org -> 404
    const lonely = await User.create({ email: `lonely2-${Date.now()}@test`, password: 'pass' })
    const resp2 = await client.loginAs(lonely).get('/organization/compliance/stats')
    resp2.assertStatus(404)

    // valid org-scoped stats
    const org = await Organization.create({ name: 'Compliance Org' })
    const admin = await User.create({ email: `compadmin-${Date.now()}@test`, password: 'pass' })
    await OrganizationTeamMember.create({ organizationId: org.id, userId: admin.id, role: 'Admin' })

    const v1 = await User.create({ email: `compv1-${Date.now()}@test`, password: 'pass' })
    const v2 = await User.create({ email: `compv2-${Date.now()}@test`, password: 'pass' })
    // add as volunteers for this org
    await OrganizationVolunteer.create({ organizationId: org.id, userId: v1.id, status: 'Active' })
    await OrganizationVolunteer.create({ organizationId: org.id, userId: v2.id, status: 'Active' })

    // create compliance documents: one approved, one pending and one expiring soon
    await ComplianceDocument.create({ userId: v1.id, status: 'Approved', docType: 'ID' })
    await ComplianceDocument.create({ userId: v2.id, status: 'Pending', docType: 'License' })
    await ComplianceDocument.create({
      userId: v2.id,
      status: 'Approved',
      docType: 'Med',
      expiresAt: DateTime.now().plus({ days: 10 })
    })

    const stats = await client.loginAs(admin).get('/organization/compliance/stats')
    stats.assertStatus(200)
    stats.assertBodyContains({ pendingDocuments: 1 })
  })

  test('pending hours: returns paginated count for organization', async ({ client, assert }) => {
    const org = await Organization.create({ name: 'Hours Org' })
    const admin = await User.create({ email: `hoursadmin-${Date.now()}@test`, password: 'pass' })
    await OrganizationTeamMember.create({ organizationId: org.id, userId: admin.id, role: 'Admin' })

    // volunteer
    const v = await User.create({ email: `hoursv-${Date.now()}@test`, password: 'pass' })
    await OrganizationVolunteer.create({ organizationId: org.id, userId: v.id, status: 'Active' })

    // create two pending hour logs
    await Database.table('volunteer_hours').insert({
      user_id: v.id,
      status: 'pending',
      hours: 3,
      date: new Date()
    })
    await Database.table('volunteer_hours').insert({
      user_id: v.id,
      status: 'pending',
      hours: 2,
      date: new Date()
    })

    // request with limit=1 to ensure pagination meta total is used
    const resp = await client.loginAs(admin).get('/organization/hours/pending?page=1&limit=1')
    resp.assertStatus(200)
    const body = resp.body()
    // Ensure paginator meta has total equal to 2
    assert.equal(body?.meta?.total, 2)
  })

  test('compliance stats: works with mixed team-member & volunteer users', async ({ client }) => {
    const org = await Organization.create({ name: 'Mixed Users Org' })
    const admin = await User.create({ email: `mixedadmin-${Date.now()}@test`, password: 'pass' })
    await OrganizationTeamMember.create({ organizationId: org.id, userId: admin.id, role: 'Admin' })

    // create two volunteers, one via OrganizationVolunteer, another is a team member
    const v1 = await User.create({ email: `mixedv1-${Date.now()}@test`, password: 'pass' })
    const v2 = await User.create({ email: `mixedv2-${Date.now()}@test`, password: 'pass' })
    await OrganizationVolunteer.create({ organizationId: org.id, userId: v1.id, status: 'Active' })
    await OrganizationTeamMember.create({ organizationId: org.id, userId: v2.id, role: 'Member' })

    // create compliance docs
    await ComplianceDocument.create({ userId: v1.id, status: 'Pending', docType: 'License' })
    await ComplianceDocument.create({ userId: v2.id, status: 'Approved', docType: 'ID' })

    const stats = await client.loginAs(admin).get('/organization/compliance/stats')
    stats.assertStatus(200)
    // one pending document exists
    stats.assertBodyContains({ pendingDocuments: 1 })
  })

  test('profile: update persists new profile fields and returns normalized payload', async ({
    client,
    assert
  }) => {
    const org = await Organization.create({ name: 'Profile Org' })
    const admin = await User.create({ email: `profileadmin-${Date.now()}@test`, password: 'pass' })
    await OrganizationTeamMember.create({ organizationId: org.id, userId: admin.id, role: 'Admin' })

    // initial fetch
    const fetchResp = await client.loginAs(admin).get('/organization/profile')
    fetchResp.assertStatus(200)

    // update profile with new fields
    const payload = {
      name: 'Profile Org Updated',
      email: 'contact@profile.org',
      phone: '1234567890',
      website: 'https://profile.example',
      address: '123 Main St',
      type: 'Non-profit',
      logo: 'logos/profile.png',
      description: 'Updated description'
    }

    const updateResp = await client.loginAs(admin).put('/organization/profile').json(payload)
    updateResp.assertStatus(200)
    const body = updateResp.body()

    // ensure the normalized keys are present
    assert.equal(body.name, payload.name)
    assert.equal(body.email, payload.email)
    assert.equal(body.phone, payload.phone)
    assert.equal(body.website, payload.website)
    assert.equal(body.address, payload.address)
    assert.equal(body.type, payload.type)
    assert.equal(body.logo, `/uploads/${payload.logo}`)

    // confirm persisted in DB
    const dbRow = await Database.from('organizations').where('id', org.id).first()
    assert.equal(dbRow.name, payload.name)
    assert.equal(dbRow.website, payload.website)
    assert.equal(dbRow.address, payload.address)
  })
})
