import { test } from '@japa/runner'

test.group('Organizations resource endpoints', () => {
  test('show organization by id', async ({ client }) => {
    const Organization = await import('App/Models/Organization')
    const org = await Organization.default.create({ name: 'Resource Org' })

    const User = await import('App/Models/User')
    const user = await User.default.create({ email: 'viewer@test', password: 'password' })

    const response = await client.loginAs(user).get(`/organizations/${org.id}`)
    response.assertStatus(200)
    response.assertBodyContains({ name: 'Resource Org' })
  })

  test('update organization by id', async ({ client }) => {
    const Organization = await import('App/Models/Organization')
    const org = await Organization.default.create({ name: 'Update Org' })

    const User = await import('App/Models/User')
    const user = await User.default.create({ email: 'updater@test', password: 'password' })

    const response = await client
      .loginAs(user)
      .put(`/organizations/${org.id}`)
      .json({ name: 'Updated Org Name' })

    response.assertStatus(200)
    response.assertBodyContains({ name: 'Updated Org Name' })
  })
})
