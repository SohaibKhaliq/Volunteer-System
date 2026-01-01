import { test } from '@japa/runner'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Types API', (group) => {
  group.teardown(async () => {
    await Database.rawQuery('DELETE FROM types')
  })

  test('list/create/update/delete types', async ({ client, assert }) => {
    // List initially may be empty (or seeded), but we can create a new type
    const createRes = await client
      .post('/types')
      .json({ name: 'Test Type', category: 'Custom', description: 'A test type' })
    createRes.assertStatus(201)
    const created = createRes.body()
    assert.exists(created && created.id)
    assert.isTrue(created.name === 'Test Type')

    // List contains our created type
    const list = await client.get('/types')
    list.assertStatus(200)
    const items = list.body()
    assert.isArray(items)
    assert.isTrue(items.some((t: any) => t.id === created.id))

    // Update the type
    const updateRes = await client
      .put(`/types/${created.id}`)
      .json({ name: 'Updated Type', description: 'Updated desc' })
    updateRes.assertStatus(200)
    const updated = updateRes.body()
    assert.isTrue(updated.name === 'Updated Type')

    // Delete
    const del = await client.delete(`/types/${created.id}`)
    del.assertStatus(204)

    // ensure removed
    const after = await client.get('/types')
    after.assertStatus(200)
    const afterItems = after.body()
    assert.isFalse(afterItems.some((t: any) => t.id === created.id))
  })
})

