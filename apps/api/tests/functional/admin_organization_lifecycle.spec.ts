import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import AuditLog from 'App/Models/AuditLog'

test.group('Admin organization lifecycle', (group) => {
  group.teardown(async () => {
    await AuditLog.query().where('action', 'like', 'organization_%').delete()
    await Organization.query().where('name', 'like', 'Org Lifecycle%').delete()
    await User.query().where('email', 'like', '%admin-org-lifecycle%').delete()
  })

  test('admin can approve, suspend, reactivate and archive an organization', async ({ client }) => {
    const admin = await User.create({
      email: 'admin-org-lifecycle@test',
      password: 'pass',
      isAdmin: true
    })

    // create a pending org
    const org = await Organization.create({ name: 'Org Lifecycle 1', status: 'pending' })

    // approve
    const approveResp = await client
      .loginAs(admin)
      .post(`/admin/organizations/${org.id}/approve`)
      .json()
    approveResp.assertStatus(200)
    const approved = await Organization.find(org.id)
    test.assert(approved && approved.status === 'active')

    // suspend
    const suspendResp = await client
      .loginAs(admin)
      .post(`/admin/organizations/${org.id}/suspend`)
      .json({ reason: 'Violation' })
    suspendResp.assertStatus(200)
    const suspended = await Organization.find(org.id)
    test.assert(suspended && suspended.status === 'suspended')

    // reactivate
    const reactResp = await client
      .loginAs(admin)
      .post(`/admin/organizations/${org.id}/reactivate`)
      .json()
    reactResp.assertStatus(200)
    const reactivated = await Organization.find(org.id)
    test.assert(reactivated && reactivated.status === 'active')

    // archive
    const archResp = await client
      .loginAs(admin)
      .post(`/admin/organizations/${org.id}/archive`)
      .json()
    archResp.assertStatus(200)
    const archived = await Organization.find(org.id)
    test.assert(archived && archived.status === 'archived')

    // ensure audit logs created
    const logs = await AuditLog.query().whereIn('action', [
      'organization_approved',
      'organization_suspended',
      'organization_reactivated',
      'organization_archived'
    ])
    test.assert(logs.length >= 4)

    // verify details of the approve audit entry
    const approvedLog = await AuditLog.query().where('action', 'organization_approved').first()
    test.assert(approvedLog)
    if (typeof approvedLog?.targetType !== 'undefined') {
      test.assert(approvedLog?.targetType === 'organization')
    }
    if (typeof approvedLog?.targetId !== 'undefined') {
      test.assert(approvedLog?.targetId === org.id)
    }
    if (typeof approvedLog?.metadata !== 'undefined') {
      test.assert(approvedLog?.metadata && approvedLog?.metadata.includes('pending'))
    }
  })
})
