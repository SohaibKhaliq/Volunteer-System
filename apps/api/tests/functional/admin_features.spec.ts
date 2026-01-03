import { test } from '@japa/runner'
import User from 'App/Models/User'

test.group('Admin features endpoint', () => {
  test('unauthenticated cannot fetch features', async ({ client }) => {
    const response = await client.get('/admin/features')
    response.assertStatus(401)
  })

  test('authenticated admin receives features object', async ({ client, assert }) => {
    const email = `admin-feat-${Date.now()}@test`
    const admin = await User.create({ email, password: 'pass', isAdmin: true })
    const token = await client.loginAs(admin)
    const resp = await client.get('/admin/features').header('Authorization', `Bearer ${token}`)
    resp.assertStatus(200)
    const body = resp.body()
    assert.isObject(body)
    assert.property(body, 'dataOps')
    assert.property(body, 'analytics')
    assert.property(body, 'monitoring')
    assert.property(body, 'scheduling')
  })
})
