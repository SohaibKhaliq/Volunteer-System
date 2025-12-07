import { test } from '@japa/runner'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Volunteer hours audit logging', () => {
  test('update creates an audit log', async ({ client }) => {
    const admin = await User.create({ email: 'va-admin@test', password: 'pass', isAdmin: true })

    const u = await User.create({ email: 'va-v@test', password: 'pass' })
    const inserted = await Database.table('volunteer_hours').insert({
      user_id: u.id,
      status: 'pending',
      hours: 2,
      date: new Date()
    })
    // inserted returns an array in lucide mysql driver,
    const id = (inserted as any)[0]

    const res = await client.loginAs(admin).put(`/hours/${id}`).json({ status: 'Approved' })
    res.assertStatus(200)

    const logs = await Database.from('audit_logs').where('action', 'volunteer_hours_status_changed')
    test.assert(logs.length > 0)
    test.assert(logs.some((l: any) => l.details && l.details.includes('Approved')))
  })

  test('bulk update creates an audit log', async ({ client }) => {
    const admin = await User.create({ email: 'va-admin2@test', password: 'pass', isAdmin: true })

    const u1 = await User.create({ email: 'va-bulk1@test', password: 'pass' })
    const u2 = await User.create({ email: 'va-bulk2@test', password: 'pass' })

    const ids = []
    const a1: any = await Database.table('volunteer_hours').insert({
      user_id: u1.id,
      status: 'pending',
      hours: 1,
      date: new Date()
    })
    const a2: any = await Database.table('volunteer_hours').insert({
      user_id: u2.id,
      status: 'pending',
      hours: 1,
      date: new Date()
    })
    ids.push((a1 as any)[0])
    ids.push((a2 as any)[0])

    const res = await client.loginAs(admin).post('/hours/bulk').json({ ids, status: 'Approved' })
    res.assertStatus(200)

    const logs = await Database.from('audit_logs').where('action', 'volunteer_hours_bulk_update')
    test.assert(logs.length > 0)
    test.assert(logs.some((l: any) => l.details && l.details.includes('Approved')))
  })
})
