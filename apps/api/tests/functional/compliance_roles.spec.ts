import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import ComplianceDocument from 'App/Models/ComplianceDocument'
import Database from '@ioc:Adonis/Lucid/Database'
import fs from 'fs'
import path from 'path'
import { DateTime } from 'luxon'

test.group('Compliance Role Rules', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  const prepareFile = async (name: string) => {
    const fixturesDir = path.join(__dirname, 'fixtures')
    await fs.promises.mkdir(fixturesDir, { recursive: true })
    const filePath = path.join(fixturesDir, name)
    await fs.promises.writeFile(filePath, 'dummy content')
    return filePath
  }

  test('admin with org membership can upload on behalf of another user', async ({
    client,
    assert
  }) => {
    const org = await Organization.create({ name: `Org-${Date.now()}` })
    const admin = await User.create({
      email: `adm-${Date.now()}@test.com`,
      password: 'pass',
      firstName: 'Admin',
      lastName: 'User'
    })
    // create membership with admin role
    await OrganizationTeamMember.create({ userId: admin.id, organizationId: org.id, role: 'admin' })

    const target = await User.create({
      email: `target-${Date.now()}@test.com`,
      password: 'pass',
      firstName: 'Target',
      lastName: 'User'
    })
    const filePath = await prepareFile('adm_upload.pdf')

    const response = await client
      .loginAs(admin)
      .post('/compliance')
      .field('doc_type', 'certification')
      .field('issued_at', DateTime.now().toISO())
      .field('organization_id', String(org.id))
      .field('target_user_id', String(target.id))
      .file('file', filePath)

    response.assertStatus(201)
    const body = response.body()
    assert.equal(body.userId, target.id)
    const doc = await ComplianceDocument.find(body.id)
    assert.exists(doc)
  })

  test('organization member cannot upload personal document for other volunteer', async ({
    client
  }) => {
    const org = await Organization.create({ name: `Org2-${Date.now()}` })
    const member = await User.create({
      email: `mem-${Date.now()}@test.com`,
      password: 'pass',
      firstName: 'Member',
      lastName: 'User'
    })
    await OrganizationTeamMember.create({
      userId: member.id,
      organizationId: org.id,
      role: 'member'
    })

    const other = await User.create({
      email: `other-${Date.now()}@test.com`,
      password: 'pass',
      firstName: 'Other',
      lastName: 'User'
    })
    const filePath = await prepareFile('mem_upload.pdf')

    const response = await client
      .loginAs(member)
      .post('/compliance')
      .field('doc_type', 'certification')
      .field('issued_at', DateTime.now().toISO())
      .field('organization_id', String(org.id))
      .field('target_user_id', String(other.id))
      .file('file', filePath)

    response.assertStatus(403)
  })

  test('volunteer cannot update another users document', async ({ client }) => {
    const vol = await User.create({
      email: `vol-${Date.now()}@test.com`,
      password: 'pass',
      firstName: 'Vol',
      lastName: 'User'
    })
    const other = await User.create({
      email: `oth-${Date.now()}@test.com`,
      password: 'pass',
      firstName: 'Other',
      lastName: 'User'
    })

    const doc = await ComplianceDocument.create({
      userId: other.id,
      docType: 'other',
      status: 'approved'
    })

    const response = await client
      .loginAs(vol)
      .put(`/compliance/${doc.id}`)
      .json({ doc_type: 'police_check' })
    response.assertStatus(403)
  })

  test('admin can delete document in their organization', async ({ client, assert }) => {
    const org = await Organization.create({ name: `OrgDel-${Date.now()}` })
    const admin = await User.create({
      email: `adm2-${Date.now()}@test.com`,
      password: 'pass',
      firstName: 'Admin2',
      lastName: 'User'
    })
    await OrganizationTeamMember.create({ userId: admin.id, organizationId: org.id, role: 'admin' })

    const target = await User.create({
      email: `t2-${Date.now()}@test.com`,
      password: 'pass',
      firstName: 'Target2',
      lastName: 'User'
    })
    const doc = await ComplianceDocument.create({
      userId: target.id,
      docType: 'other',
      organizationId: org.id,
      status: 'approved'
    })

    const response = await client.loginAs(admin).delete(`/compliance/${doc.id}`)
    response.assertStatus(204)

    const found = await ComplianceDocument.find(doc.id)
    assert.isNull(found)
  })
})
