import { test } from '@japa/runner'
import User from 'App/Models/User'

test.group('Admin features endpoint', () => {
  test('unauthenticated cannot fetch features', async ({ client }) => {
    const response = await client.get('/admin/features')
    response.assertStatus(401)
  })

  test('authenticated admin receives features object', async ({ client }) => {
    const email = `admin-feat-${Date.now()}@test`
    const admin = await User.create({ email, password: 'pass', isAdmin: true })
    const token = await client.loginAs(admin)
    const resp = await client.get('/admin/features').header('Authorization', `Bearer ${token}`)
    resp.assertStatus(200)
    const body = resp.body()
    test.assert(typeof body === 'object')
    test.assert('dataOps' in body)
    test.assert('analytics' in body)
    test.assert('monitoring' in body)
    test.assert('scheduling' in body)
  })
})
