import test from 'japa'
import Database from '@ioc:Adonis/Lucid/Database'
import supertest from 'supertest'
import { apiUrl } from '../../test/config'
import User from 'App/Models/User'

let server: any

test.group('HelpRequest Assign', (group) => {
  group.before(async () => {
    server = supertest(apiUrl())
  })

  group.after(async () => {
    await Database.rollbackAll()
  })

  test('returns 400 when volunteerId is missing', async (assert) => {
    await Database.beginTransaction()

    const createRes = await server.post('/help-requests').send({
      name: 'AssignTest',
      description: 'Assign missing volunteer',
      location: { address: 'x', lat: 0, lng: 0 },
      types: []
    })
    assert.equal(createRes.status, 201)
    const id = createRes.body.id

    const res = await server.post(`/help-requests/${id}/assign`).send({})
    assert.equal(res.status, 400)
    assert.equal(res.body.error.message, 'volunteerId is required')

    await Database.rollbackAll()
  })

  test('returns 400 when volunteer does not exist', async (assert) => {
    await Database.beginTransaction()

    const createRes = await server.post('/help-requests').send({
      name: 'AssignTest',
      description: 'Assign missing volunteer',
      location: { address: 'x', lat: 0, lng: 0 },
      types: []
    })
    assert.equal(createRes.status, 201)
    const id = createRes.body.id

    const res = await server.post(`/help-requests/${id}/assign`).send({ volunteerId: 999999 })
    assert.equal(res.status, 400)
    assert.equal(res.body.error.message, 'Volunteer not found')

    await Database.rollbackAll()
  })

  test('assigns volunteer when valid', async (assert) => {
    await Database.beginTransaction()

    const user = await User.create({
      email: `v-${Date.now()}@test`,
      password: 'pass',
      firstName: 'Vol',
      lastName: 'User'
    })

    const createRes = await server.post('/help-requests').send({
      name: 'AssignTest',
      description: 'Assign success',
      location: { address: 'x', lat: 0, lng: 0 },
      types: []
    })
    assert.equal(createRes.status, 201)
    const id = createRes.body.id

    const res = await server.post(`/help-requests/${id}/assign`).send({ volunteerId: user.id })
    assert.equal(res.status, 200)
    assert.equal(res.body.assignedVolunteerId, user.id)
    assert.equal(res.body.status, 'assigned')

    await Database.rollbackAll()
  })
})
