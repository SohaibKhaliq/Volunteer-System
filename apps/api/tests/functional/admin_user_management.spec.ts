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
      isAdmin: true
    })
    const target = await User.create({ email: 'target-user-mgmt_' + Math.floor(Math.random() * 100000) + '@test.com', password: 'pass' })

    // disable target
    const resp = await client
      .loginAs(admin)
      .post(`/admin/users/${target.id}/disable`)
      .json({ reason: 'spam' })
    resp.assertStatus(200)
    const reloaded = await User.find(target.id)
    assert.isTrue(reloaded && reloaded.isDisabled === 1 || reloaded.isDisabled === true)

    // cannot disable self
    const selfResp = await client
      .loginAs(admin)
      .post(`/admin/users/${admin.id}/disable`)
      .json({ reason: 'test' })
    selfResp.assertStatus(400)

    // enable target
    const enableResp = await client.loginAs(admin).post(`/admin/users/${target.id}/enable`).json()
    enableResp.assertStatus(200)
    const reloaded2 = await User.find(target.id)
    // Checking for 0 or false just in case boolean/tinyint diff
    assert.isTrue(reloaded2 && (reloaded2.isDisabled === 0 || reloaded2.isDisabled === false))
  })
})
