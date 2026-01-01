import { test } from '@japa/runner'
import fs from 'fs'
import path from 'path'

test.group('Offers upload', () => {
  test('can create offer with file upload', async ({ client, assert }) => {
    // build fixture file
    const fixturesDir = path.join(__dirname, 'fixtures')
    await fs.promises.mkdir(fixturesDir, { recursive: true })
    const filePath = path.join(fixturesDir, 'offer.txt')
    await fs.promises.writeFile(filePath, 'hello-offer')

    const resp = await client
      .post('/offers')
      .file('files', filePath)
      .field('types', JSON.stringify(['medical_assistance']))
      .field('location', JSON.stringify({ lng: 1, lat: 2, address: 'here' }))
      .field('description', 'A helpful offer')
      .field('name', 'Offer Name')
      .field('email', 'offer@example.com')
      .field('phone', '1234567890')
      .field('isOnSite', 'no')

    resp.assertStatus(201)
    const body = resp.body()
    assert.exists(body.files)

    // confirm file exists in tmp uploads
    const Application = await import('@ioc:Adonis/Core/Application')
    const tmp = Application.default.tmpPath('uploads')
    const filesArr = JSON.parse(body.files)
    assert.isArray(filesArr)
    assert.isTrue(filesArr.length >= 1)
    const first = filesArr[0]
    const fileOnDisk = path.join(tmp, first.path)
    if (!fs.existsSync(fileOnDisk)) throw new Error(`Expected uploaded file at ${fileOnDisk}`)
  })
})
