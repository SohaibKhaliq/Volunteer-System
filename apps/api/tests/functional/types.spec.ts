import { test } from '@japa/runner'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Types API', (group) => {
  group.teardown(async () => {
    await Database.rawQuery('DELETE FROM types')
  })

  test('list/create/update/delete types', async ({ client }) => {
    // List initially may be empty (or seeded), but we can create a new type
    const createRes = await client
      .post('/types')
      .json({ name: 'Test Type', category: 'Custom', description: 'A test type' })
    createRes.assertStatus(201)
    const created = createRes.body()
    test.assert(created && created.id)
    test.assert(created.name === 'Test Type')

    // List contains our created type
    const list = await client.get('/types')
    list.assertStatus(200)
    const items = list.body()
    test.assert(Array.isArray(items))
    test.assert(items.some((t: any) => t.id === created.id))

    // Update the type
    const updateRes = await client
      .put(`/types/${created.id}`)
      .json({ name: 'Updated Type', description: 'Updated desc' })
    updateRes.assertStatus(200)
    const updated = updateRes.body()
    test.assert(updated.name === 'Updated Type')

    // Delete
    const del = await client.delete(`/types/${created.id}`)
    del.assertStatus(204)

    // ensure removed
    const after = await client.get('/types')
    after.assertStatus(200)
    const afterItems = after.body()
    test.assert(!afterItems.some((t: any) => t.id === created.id))
  })
})
import { test } from '@japa/runner'
import Type from 'App/Models/Type'

test.group('Types endpoints', () => {
  test('GET /types returns list', async ({ client }) => {
    await Type.create({ type: 'rescue' } as any)
    const res = await client.get('/types')
    res.assertStatus(200)
    const body = res.body()
    test.assert(Array.isArray(body))
    test.assert(body.length >= 1)
  })

  test('POST /types create a new type', async ({ client }) => {
    const res = await client.post('/types').json({ type: 'food' })
    res.assertStatus(201)
    const body = res.body()
    test.assert(body && body.type === 'food')
  })

  test('PUT /types/:id update existing type', async ({ client }) => {
    const t = await Type.create({ type: 'other' } as any)
    const res = await client.put(`/types/${t.id}`).json({ type: 'shelter' })
    res.assertStatus(200)
    const body = res.body()
    test.assert(body && body.type === 'shelter')
  })

  test('DELETE /types/:id destroys the entry', async ({ client }) => {
    const t = await Type.create({ type: 'medical_assistance' } as any)
    const res = await client.delete(`/types/${t.id}`)
    res.assertStatus(204)
  })
})
