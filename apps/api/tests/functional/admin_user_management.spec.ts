import { test } from '@japa/runner'
import User from 'App/Models/User'

test.group('Admin user management', (group) => {
  group.teardown(async () => {
    await User.query().where('email', 'like', '%admin-user-mgmt%').delete()
  })

  test('admin can disable and enable a user but cannot disable themselves', async ({ client, assert }) => {
    const admin = await User.create({
      email: 'admin-user-mgmt_' + Math.floor(Math.random() * 100000) + '@test.com',
      password: 'pass',
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true
    })
    const target = await User.create({ email: 'target-user-mgmt_' + Math.floor(Math.random() * 100000) + '@test.com', password: 'pass', firstName: 'Test', lastName: 'User' })

    // disable target
    const resp = await client
      .loginAs(admin)
      .post(`/admin/users/${target.id}/disable`)
      .json({ reason: 'spam' })
    resp.assertStatus(200)
    const reloaded = await User.find(target.id) 
    assert.isTrue(Boolean(reloaded?.isDisabled))

    // cannot disable self
    const selfResp = await client
      .loginAs(admin)
      .post(`/admin/users/${admin.id}/disable`)
      .json({ reason: 'test' })
    selfResp.assertStatus(400)

    // enable target
    const enableResp = await client.loginAs(admin).post(`/admin/users/${target.id}/enable`).json({})
    enableResp.assertStatus(200)
    const reloaded2 = await User.find(target.id)
    assert.isFalse(Boolean(reloaded2?.isDisabled))
  })
})
