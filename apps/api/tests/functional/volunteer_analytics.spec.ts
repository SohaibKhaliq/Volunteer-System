import { test } from '@japa/runner'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

test.group('Volunteer analytics endpoints', () => {
  test('trends endpoint (month/week) works on MySQL', async ({ client }) => {
    const org = await Organization.create({ name: 'Analytics Org' })
    const admin = await User.create({ email: `analytics_admin_${Date.now()}@test`, password: 'pass', firstName: 'Test', lastName: 'User' })
    await OrganizationTeamMember.create({ organizationId: org.id, userId: admin.id, role: 'Admin' })

    // create another user and volunteer_hours tied to this org via organization_volunteers
    const vol = await User.create({ email: `vol_analytics_${Date.now()}@test`, password: 'pass', firstName: 'Test', lastName: 'User' })
    await Database.table('organization_volunteers').insert({
      organization_id: org.id,
      user_id: vol.id,
      role: 'volunteer',
      status: 'active',
      joined_at: DateTime.now().minus({ months: 3 }).toSQL({ includeOffset: false }),
      created_at: DateTime.now().toSQL({ includeOffset: false }),
      updated_at: DateTime.now().toSQL({ includeOffset: false })
    })

    // insert volunteer hours across the last 6 months
    const base = DateTime.now()
    for (let i = 0; i < 6; i++) {
      const d = base.minus({ months: i })
      await Database.table('volunteer_hours').insert({
        user_id: vol.id,
        event_id: null,
        date: d.toSQLDate(),
        hours: 2 + i,
        status: 'approved',
        created_at: DateTime.now().toSQL({ includeOffset: false }),
        updated_at: DateTime.now().toSQL({ includeOffset: false })
      })
    }

    // request monthly trends
    const monthly = await client
      .loginAs(admin)
      .get('/organization/analytics/trends')
      .qs({ interval: 'month' })
    monthly.assertStatus(200)
    monthly.assertBodyContains({ interval: 'month' })

    // request weekly trends
    const weekly = await client
      .loginAs(admin)
      .get('/organization/analytics/trends')
      .qs({ interval: 'week' })
    weekly.assertStatus(200)
    weekly.assertBodyContains({ interval: 'week' })
  })
})
