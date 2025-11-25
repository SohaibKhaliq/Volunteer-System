import { test } from '@japa/runner'

test.group('Organizations', () => {
  test('create an organization', async ({ client }) => {
    // create an authenticated user so org creation is permitted
    const User = await import('App/Models/User')
    const user = await User.default.create({ email: 'creator@test', password: 'password' })

    const response = await client
      .loginAs(user)
      .post('/organizations')
      .json({ name: 'Test Org', description: 'A test' })
    response.assertStatus(201)
    response.assertBodyContains({ name: 'Test Org' })
  })

  test('list organizations', async ({ client }) => {
    const User = await import('App/Models/User')
    const user = await User.default.create({ email: 'lister@test', password: 'password' })

    const response = await client.loginAs(user).get('/organizations')
    response.assertStatus(200)
    response.assertNotNull(response.body())
  })
})
