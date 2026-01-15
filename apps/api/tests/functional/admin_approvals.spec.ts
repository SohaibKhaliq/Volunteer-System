import test from 'japa'
import Database from '@ioc:Adonis/Lucid/Database'
import supertest from 'supertest'
import { apiUrl } from '../../test/config'
import User from 'App/Models/User'

let server: any

test.group('Admin Approvals', (group) => {
  group.before(async () => {
    server = supertest(apiUrl())
  })

  group.after(async () => {
    await Database.rollbackAll()
  })

  test('help request is hidden until approved', async (assert) => {
    await Database.beginTransaction()

    const user = await User.create({
      email: `u-${Date.now()}@test`,
      password: 'pass',
      firstName: 'Test',
      lastName: 'User'
    })
    const admin = await User.create({
      email: `admin-${Date.now()}@test`,
      password: 'pass',
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true
    })

    // create help request as non-admin
    const createRes = await server.post('/help-requests').send({
      name: 'Hidden',
      description: 'Pending',
      location: { address: 'x', lat: 0, lng: 0 },
      types: []
    })
    assert.equal(createRes.status, 201)
    const id = createRes.body.id

    // Public list should not contain it
    const publicList = await server.get('/help-requests')
    assert.notExists(publicList.body.find((r: any) => r.id === id))

    // Admin can see pending (paginated response)
    const adminList = await server
      .get('/admin/approvals/help_requests')
      .set('Authorization', `Bearer ${await admin.generateToken('api')}`)
    // support both array and paginated responses
    const listData = Array.isArray(adminList.body)
      ? adminList.body
      : (adminList.body.data ?? adminList.body.items ?? [])
    assert.exists(listData.find((r: any) => r.id === id))

    // Approve it
    const approve = await server
      .post(`/admin/approvals/help_requests/${id}/approve`)
      .set('Authorization', `Bearer ${await admin.generateToken('api')}`)
    assert.equal(approve.status, 200)

    // Now public list should include it
    const publicList2 = await server.get('/help-requests')
    assert.exists(publicList2.body.find((r: any) => r.id === id))

    await Database.rollbackAll()
  })
})
