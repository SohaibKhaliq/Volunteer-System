import { test } from '@japa/runner'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import Event from 'App/Models/Event'
import ComplianceDocument from 'App/Models/ComplianceDocument'
import { DateTime } from 'luxon'

test.group('Organization panel endpoints', () => {
  test('events: unauthenticated returns 401', async ({ client }) => {
    const resp = await client.get('/organization/events')
    resp.assertStatus(401)
  })

  test('events: scoped to organization member and can create', async ({ client }) => {
    const orgA = await Organization.create({ name: 'Org A' })
    const orgB = await Organization.create({ name: 'Org B' })
    const user = await User.create({ email: 'eventuser@test', password: 'pass' })
    await OrganizationTeamMember.create({ organizationId: orgA.id, userId: user.id, role: 'Admin' })

    // create events across organizations
    await Event.create({
      title: 'Event A1',
      organizationId: orgA.id,
      startAt: DateTime.now().plus({ days: 5 }).toJSDate()
    })
    await Event.create({
      title: 'Event B1',
      organizationId: orgB.id,
      startAt: DateTime.now().plus({ days: 2 }).toJSDate()
    })

    const listResp = await client.loginAs(user).get('/organization/events')
    listResp.assertStatus(200)
    const listBody = listResp.body()
    // only events for orgA should be returned
    listBody.forEach((e: any) => {
      if (e.organizationId) test.assert(e.organizationId === orgA.id)
    })

    // Create an event via POST (should be scoped to user's org)
    const createResp = await client
      .loginAs(user)
      .post('/organization/events')
      .json({ title: 'Created A', start_at: DateTime.now().toISO() })
    createResp.assertStatus(201)
    createResp.assertBodyContains({ organizationId: orgA.id })
  })

  test('volunteers: unauthenticated returns 401', async ({ client }) => {
    const resp = await client.get('/organization/volunteers')
    resp.assertStatus(401)
  })

  test('volunteers: scoped to organization member and can create', async ({ client }) => {
    const org = await Organization.create({ name: 'Vols Org' })
    const other = await Organization.create({ name: 'Other Org' })
    const admin = await User.create({ email: 'voladmin@test', password: 'pass' })
    await OrganizationTeamMember.create({ organizationId: org.id, userId: admin.id, role: 'Admin' })

    const u1 = await User.create({ email: 'vol1@test', password: 'pass' })
    const u2 = await User.create({ email: 'vol2@test', password: 'pass' })
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
    test.assert(body.every((v: any) => v.organizationId === org.id))

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
    await client.get('/organization/compliance/stats').assertStatus(401)

    // authenticated but not part of an org -> 404
    const lonely = await User.create({ email: 'lonely2@test', password: 'pass' })
    await client.loginAs(lonely).get('/organization/compliance/stats').assertStatus(404)

    // valid org-scoped stats
    const org = await Organization.create({ name: 'Compliance Org' })
    const admin = await User.create({ email: 'compadmin@test', password: 'pass' })
    await OrganizationTeamMember.create({ organizationId: org.id, userId: admin.id, role: 'Admin' })

    const v1 = await User.create({ email: 'compv1@test', password: 'pass' })
    const v2 = await User.create({ email: 'compv2@test', password: 'pass' })
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
      expiresAt: DateTime.now().plus({ days: 10 }).toJSDate()
    })

    const stats = await client.loginAs(admin).get('/organization/compliance/stats')
    stats.assertStatus(200)
    stats.assertBodyContains({ pendingDocuments: 1 })
  })
})
