import { test } from '@japa/runner'
import fs from 'fs'
import path from 'path'

test.group('Carpooling uploads', () => {
  test('can create carpooling ad with file upload', async ({ client, assert }) => {
    const fixturesDir = path.join(__dirname, 'fixtures')
    await fs.promises.mkdir(fixturesDir, { recursive: true })
    const filePath = path.join(fixturesDir, 'carpool.txt')
    await fs.promises.writeFile(filePath, 'carpool')

    const resp = await client
      .post('/carpooling-ads')
      .file('files', filePath)
      .field('type', 'offer')
      .field('departureLongitude', '1')
      .field('departureLatitude', '2')
      .field('departureAddress', 'here')
      .field('arrivalLongitude', '3')
      .field('arrivalLatitude', '4')
      .field('arrivalAddress', 'there')
      .field('departureDate', new Date().toISOString())
      .field('arrivalDate', new Date().toISOString())
      .field('description', 'Carpool desc')
      .field('capacity', 4)
      .field('storageSpace', 'low')

    resp.assertStatus(201)
    const body = resp.body()
    assert.exists(body.files)

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
