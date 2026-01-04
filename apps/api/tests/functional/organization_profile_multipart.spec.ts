import { test } from '@japa/runner'
import fs from 'fs'
import path from 'path'

test.group('Organization profile multipart updates', () => {
  test('can upload logo and update boolean flags via multipart/form-data', async ({ client }) => {
    const Organization = await import('App/Models/Organization')
    const User = await import('App/Models/User')
    const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')

    const org = await Organization.default.create({ name: 'Multipart Org' })
    const admin = await User.default.create({ email: `multipart-admin-${Date.now()}@test`, password: 'secret', firstName: 'Test', lastName: 'User' })

    await OrganizationTeamMember.default.create({
      organizationId: org.id,
      userId: admin.id,
      role: 'Admin'
    })

    // ensure fixture exists
    const fixturesDir = path.join(__dirname, 'fixtures')
    await fs.promises.mkdir(fixturesDir, { recursive: true })
    const logoPath = path.join(fixturesDir, 'logo.png')
    const base64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mO8Xw8AAlIBVwZJ3KQAAAAASUVORK5CYII='
    await fs.promises.writeFile(logoPath, Buffer.from(base64, 'base64'))

    // submit multipart/form-data with logo and boolean flags as strings
    const resp = await client
      .loginAs(admin)
      .put('/organization/profile')
      .file('logo', logoPath)
      .field('public_profile', 'true')
      .field('auto_approve_volunteers', 'true')

    resp.assertStatus(200)
    resp.assertBodyContains({ public_profile: true })
    resp.assertBodyContains({ auto_approve_volunteers: true })
    // returned payload should contain logo path/url
    const body = resp.body()
    // make sure logo exists in response
    if (!body.logo) throw new Error('Expected logo in response')
  })
})
