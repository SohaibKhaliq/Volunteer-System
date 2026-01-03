import { test } from '@japa/runner'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'
import VolunteerHour from 'App/Models/VolunteerHour'
import { DateTime } from 'luxon'

test.group('Volunteer hours audit logging', () => {
  test('update creates an audit log', async ({ client, assert }) => {
    const admin = await User.create({ email: `va-admin-${Date.now()}@test`, password: 'pass', isAdmin: true })

    const u = await User.create({ email: `va-v-${Date.now()}@test`, password: 'pass' })
    const inserted = await Database.table('volunteer_hours').insert({
      user_id: u.id,
      status: 'pending',
      hours: 2,
      date: new Date()
    })
    // inserted returns an array in lucide mysql driver,
    const id = (inserted as any)[0]

    const res = await client.loginAs(admin).put(`/hours/${id}`).json({ status: 'approved' })
    res.assertStatus(200)

    const logs = await Database.from('audit_logs').where('action', 'volunteer_hours_status_changed')
    assert.isTrue(logs.length > 0)
    assert.isTrue(logs.some((l: any) => l.details && l.details.includes('approved')))
  })

  test('bulk update creates an audit log', async ({ client, assert }) => {
    const admin = await User.create({ email: `va-admin2-${Date.now()}@test`, password: 'pass', isAdmin: true })

    const u1 = await User.create({ email: `va-bulk1-${Date.now()}@test`, password: 'pass' })
    const u2 = await User.create({ email: `va-bulk2-${Date.now()}@test`, password: 'pass' })
    
    const Organization = await import('App/Models/Organization')
    const org = await Organization.default.create({ name: `Audit Org ${Date.now()}` })
    
    // ... setup ...
    const h1 = await VolunteerHour.create({ userId: u1.id, date: DateTime.now(), hours: 1, status: 'pending', organizationId: org.id })
    const h2 = await VolunteerHour.create({ userId: u2.id, date: DateTime.now(), hours: 1, status: 'pending', organizationId: org.id })
    
    const ids = [h1.id, h2.id]

    const res = await client.loginAs(admin).post('/hours/bulk-status').json({ ids, status: 'approved' })
    res.assertStatus(200)

    const logs = await Database.from('audit_logs').where('action', 'volunteer_hours_bulk_update')
    assert.isTrue(logs.length > 0)
    assert.isTrue(logs.some((l: any) => l.details && l.details.includes('approved')))
  })
})
