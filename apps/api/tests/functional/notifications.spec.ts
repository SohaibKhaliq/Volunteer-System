import { test } from '@japa/runner'
import User from 'App/Models/User'
import Notification from 'App/Models/Notification'

test.group('Notifications endpoints', () => {
  test('non-admin users see only their notifications', async ({ client, assert }) => {
    const u1 = await User.create({ email: 'n1@test', password: 'pass' })
    const u2 = await User.create({ email: 'n2@test', password: 'pass' })

    await Notification.create({ userId: u1.id, type: 'test', payload: 'a', read: false })
    await Notification.create({ userId: u2.id, type: 'test', payload: 'b', read: false })

    const resp = await client.loginAs(u1).get('/notifications')
    resp.assertStatus(200)
    const body = resp.body()
    assert.isArray(body)
    assert.isTrue(body.every((n: any) => n.userId === u1.id))
  })

  test('admin can see all notifications', async ({ client, assert }) => {
    const admin = await User.create({ email: 'admin-not@test', password: 'pass', isAdmin: true })
    const u = await User.create({ email: 'n3@test', password: 'pass' })

    await Notification.create({ userId: u.id, type: 'x', payload: 'p' })

    const resp = await client.loginAs(admin).get('/notifications')
    resp.assertStatus(200)
    const body = resp.body()
    assert.isArray(body)
    assert.isTrue(body.length >= 1)
  })

  test('can mark notification read and unread', async ({ client, assert }) => {
    const u = await User.create({ email: 'mark@test', password: 'pass' })
    const n = await Notification.create({ userId: u.id, type: 'x', payload: 'p', read: false })

    const markResp = await client.loginAs(u).put(`/notifications/${n.id}/read`)
    markResp.assertStatus(200)
    const reloaded = await Notification.find(n.id)
    assert.isTrue(!!reloaded?.read)

    const unResp = await client.loginAs(u).put(`/notifications/${n.id}/unread`)
    unResp.assertStatus(200)
    const reloaded2 = await Notification.find(n.id)
    assert.isFalse(!!reloaded2?.read)
  })
})
