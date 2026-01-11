import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import Resource from 'App/Models/Resource'
import ResourceAssignment from 'App/Models/ResourceAssignment'

test.group('Resource Lifecycle Workflow', (group) => {
  let admin: User
  let coordinator: User
  let volunteer: User
  let organization: Organization
  let resource: Resource

  group.setup(async () => {
    // Setup users
    admin = await User.create({
      email: `admin_${Date.now()}@test.com`,
      password: 'password',
      isAdmin: true,
      firstName: 'Admin',
      lastName: 'User'
    })

    coordinator = await User.create({
      email: `coord_${Date.now()}@test.com`,
      password: 'password',
      firstName: 'Org',
      lastName: 'Coordinator'
    })

    volunteer = await User.create({
      email: `vol_${Date.now()}@test.com`,
      password: 'password',
      firstName: 'Volunteer',
      lastName: 'User'
    })

    // Setup Organization
    organization = await Organization.create({
      name: `Test Org ${Date.now()}`,
      status: 'active'
    })

    // Setup Resource
    resource = await Resource.create({
      name: 'Test Setup Resource',
      quantityTotal: 10,
      quantityAvailable: 10,
      isReturnable: true,
      category: 'equipment',
      status: 'available'
    })
  })

  // 1. Provisioning (Admin -> Org)
  test('Admin can allocate resources to organization', async ({ client, assert }) => {
    const response = await client.post('/resources/provision')
      .loginAs(admin)
      .json({
        resourceIds: [resource.id],
        orgId: organization.id
      })

    response.assertStatus(200)
    await resource.refresh()
    assert.equal(resource.organizationId, organization.id)
  })

  // 2. Distribution (Org -> Volunteer)
  test('Coordinator can distribute resource to volunteer', async ({ client, assert }) => {
    const response = await client.post('/resources/distribute')
      .loginAs(coordinator)
      .json({
        resourceId: resource.id,
        volunteerId: volunteer.id,
        notes: 'Assigned for testing',
        expectedReturnAt: new Date().toISOString()
      })

    response.assertStatus(200)
    const assignment = response.body().data
    assert.equal(assignment.status, 'IN_USE')
    
    await resource.refresh()
    assert.equal(resource.quantityAvailable, 9)
  })

  // 3. Initiation (Volunteer requests return)
  test('Volunteer can request return', async ({ client, assert }) => {
    // Get assignment ID from previous step or database
    const assignment = await ResourceAssignment.findByOrFail('resource_id', resource.id)

    const response = await client.post('/resources/return-request')
      .loginAs(volunteer)
      .json({
        assignmentId: assignment.id
      })

    response.assertStatus(200)
    await assignment.refresh()
    assert.equal(assignment.status, 'PENDING_RETURN')
  })

  // 4. Reconciliation (Org accepts return)
  test('Coordinator can reconcile return', async ({ client, assert }) => {
    const assignment = await ResourceAssignment.findByOrFail('resource_id', resource.id)

    const response = await client.post('/resources/reconcile')
      .loginAs(coordinator)
      .json({
        assignmentId: assignment.id,
        condition: 'good',
        notes: 'Returned in good condition'
      })

    response.assertStatus(200)
    
    await assignment.refresh()
    assert.equal(assignment.status, 'RETURNED')
    assert.equal(assignment.condition, 'good')

    await resource.refresh()
    assert.equal(resource.quantityAvailable, 10)
  })

  // 5. History (Chain of Custody)
  test('Chain of custody is logged', async ({ client, assert }) => {
    const response = await client.get(`/resources/${resource.id}/history`)
      .loginAs(admin)

    response.assertStatus(200)
    const logs = response.body().data
    
    // Should have 4 logs: Allocation, Distribution, Return Request, Confirmation
    assert.isAbove(logs.length, 3)
    assert.equal(logs[0].action, 'custody_chain')
  })
})
