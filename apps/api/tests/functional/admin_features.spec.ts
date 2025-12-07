import { test } from '@japa/runner'
import User from 'App/Models/User'

test.group('Admin features endpoint', () => {
  test('unauthenticated cannot fetch features', async ({ client }) => {
    await client.get('/admin/features').assertStatus(401)
  })

  test('authenticated admin receives features object', async ({ client }) => {
    const admin = await User.create({ email: 'admin-feat@test', password: 'pass', isAdmin: true })
    const resp = await client.loginAs(admin).get('/admin/features')
    resp.assertStatus(200)
    const body = resp.body()
    test.assert(typeof body === 'object')
    test.assert('dataOps' in body)
    test.assert('analytics' in body)
    test.assert('monitoring' in body)
    test.assert('scheduling' in body)
  })
})
