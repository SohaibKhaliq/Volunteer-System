import { test } from '@japa/runner'
import fs from 'fs'
import path from 'path'

test.group('Help requests upload', () => {
  test('can create help request with file upload', async ({ client }) => {
    const fixturesDir = path.join(__dirname, 'fixtures')
    await fs.promises.mkdir(fixturesDir, { recursive: true })
    const filePath = path.join(fixturesDir, 'help.txt')
    await fs.promises.writeFile(filePath, 'help me')

    const resp = await client
      .post('/help-requests')
      .file('files', filePath)
      .field('types', JSON.stringify(['medical']))
      .field('location', JSON.stringify({ lng: 1, lat: 2, address: 'there' }))
      .field('description', 'Need help')
      .field('name', 'Requester')
      .field('email', 'req@test')

    resp.assertStatus(201)
    const body = resp.body()
    test.assert(body.files)

    const Application = await import('@ioc:Adonis/Core/Application')
    const tmp = Application.default.tmpPath('uploads')
    const filesArr = JSON.parse(body.files)
    test.assert(Array.isArray(filesArr) && filesArr.length >= 1)
    const first = filesArr[0]
    const fileOnDisk = path.join(tmp, first.path)
    if (!fs.existsSync(fileOnDisk)) throw new Error(`Expected uploaded file at ${fileOnDisk}`)
  })
})
