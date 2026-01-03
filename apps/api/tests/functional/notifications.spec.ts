import { test } from '@japa/runner'
import User from 'App/Models/User'
import Notification from 'App/Models/Notification'

test.group('Notifications endpoints', () => {
  test('non-admin users see only their notifications', async ({ client, assert }) => {
    const u1 = await User.create({ email: 'n1_' + Math.floor(Math.random() * 100000) + '@test.com', password: 'pass' })
    const u2 = await User.create({ email: 'n2_' + Math.floor(Math.random() * 100000) + '@test.com', password: 'pass' })

    await Notification.create({ userId: u1.id, type: 'test', payload: JSON.stringify({ msg: 'a' }), read: false })
    await Notification.create({ userId: u2.id, type: 'test', payload: JSON.stringify({ msg: 'b' }), read: false })

    const resp = await client.loginAs(u1).get('/notifications')
    resp.assertStatus(200)
    const body = resp.body()
    // response is paginated
    assert.isArray(body.data)
    assert.isTrue(body.data.every((n: any) => n.user_id === u1.id))
  })

  test('admin can see their own notifications', async ({ client, assert }) => {
    const admin = await User.create({ email: 'admin-not_' + Math.floor(Math.random() * 100000) + '@test.com', password: 'pass', isAdmin: true })
    
    // Create notification for admin
    await Notification.create({ userId: admin.id, type: 'x', payload: JSON.stringify({ msg: 'p' }) })

    const resp = await client.loginAs(admin).get('/notifications')
    resp.assertStatus(200)
    const body = resp.body()
    assert.isArray(body.data)
    assert.isTrue(body.data.length >= 1)
    assert.equal(body.data[0].user_id, admin.id)
  })

  test('can mark notification read and unread', async ({ client, assert }) => {
    const u = await User.create({ email: 'mark_' + Math.floor(Math.random() * 100000) + '@test.com', password: 'pass' })
    const n = await Notification.create({ userId: u.id, type: 'x', payload: JSON.stringify({ msg: 'p' }), read: false })

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
