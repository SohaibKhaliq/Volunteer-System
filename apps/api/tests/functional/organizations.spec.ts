import { test } from '@japa/runner'

test.group('Organizations', () => {
  test('create an organization', async ({ client }) => {
    const response = await client
      .post('/organizations')
      .json({ name: 'Test Org', description: 'A test' })
    response.assertStatus(201)
    response.assertBodyContains({ name: 'Test Org' })
  })

  test('list organizations', async ({ client }) => {
    const response = await client.get('/organizations')
    response.assertStatus(200)
    response.assertNotNull(response.body())
  })
})
