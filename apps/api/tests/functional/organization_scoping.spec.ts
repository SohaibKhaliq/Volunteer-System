import { test } from '@japa/runner'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import Event from 'App/Models/Event'
import { DateTime } from 'luxon'

test.group('Organization dashboard scoping', () => {
  test('returns 401 when unauthenticated', async ({ client }) => {
    const response = await client.get('/organization/dashboard-stats')
    response.assertStatus(401)
  })

  test('returns 404 when user is not part of an organization', async ({ client }) => {
    const user = await User.create({ email: 'lonely@example.test', password: 'password' })
    const response = await client.loginAs(user).get('/organization/dashboard-stats')
    response.assertStatus(404)
  })

  test('returns scoped stats for organization member', async ({ client }) => {
    const org = await Organization.create({ name: 'Test Org' })
    const user = await User.create({ email: 'orguser@example.test', password: '12345678' })
    await OrganizationTeamMember.create({ organizationId: org.id, userId: user.id, role: 'Admin' })

    // one active volunteer with 20 hours
    await OrganizationVolunteer.create({
      organizationId: org.id,
      userId: user.id,
      status: 'Active',
      hours: 20,
      role: 'Volunteer'
    })

    // upcoming event
    await Event.create({
      title: 'Event 1',
      organizationId: org.id,
      startAt: DateTime.now().plus({ days: 3 }).toJSDate(),
      isPublished: true
    })

    const response = await client.loginAs(user).get('/organization/dashboard-stats')
    response.assertStatus(200)
    response.assertBodyContains({ activeVolunteers: 1, upcomingEvents: 1, totalHours: 20 })
  })
})
