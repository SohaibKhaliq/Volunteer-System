import { test } from '@japa/runner'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import Opportunity from 'App/Models/Opportunity'
import Application from 'App/Models/Application'

test.group('Admin Panel', (group) => {
  let adminUser: User
  let regularUser: User
  let testOrg: Organization

  group.setup(async () => {
    // Create admin user
    adminUser = await User.create({
      email: 'superadmin@test.com',
      password: 'password123',
      firstName: 'Super',
      lastName: 'Admin',
      isAdmin: true
    })

    // Create regular user
    regularUser = await User.create({
      email: 'regularuser@test.com',
      password: 'password123',
      firstName: 'Regular',
      lastName: 'User',
      isAdmin: false
    })

    // Create test organization
    testOrg = await Organization.create({
      name: 'Test Org for Admin',
      slug: 'test-org-admin',
      status: 'pending'
    })
  })

  group.teardown(async () => {
    await Database.rawQuery('DELETE FROM organizations WHERE slug LIKE ?', ['test-org-admin%'])
    await Database.rawQuery('DELETE FROM users WHERE email LIKE ?', ['%@test.com'])
  })

  test('admin dashboard returns stats', async ({ client, assert }) => {
    const response = await client
      .get('/admin/dashboard')
      .loginAs(adminUser)

    response.assertStatus(200)
    assert.property(response.body(), 'organizations')
    assert.property(response.body(), 'users')
    assert.property(response.body(), 'events')
  })

  test('non-admin cannot access admin dashboard', async ({ client }) => {
    const response = await client
      .get('/admin/dashboard')
      .loginAs(regularUser)

    response.assertStatus(401)
  })

  test('admin can list all organizations', async ({ client, assert }) => {
    const response = await client
      .get('/admin/organizations')
      .loginAs(adminUser)

    response.assertStatus(200)
    assert.property(response.body(), 'data')
  })

  test('admin can approve organization', async ({ client, assert }) => {
    const response = await client
      .post(`/admin/organizations/${testOrg.id}/approve`)
      .loginAs(adminUser)

    response.assertStatus(200)
    
    await testOrg.refresh()
    assert.equal(testOrg.status, 'active')
  })

  test('admin can suspend organization', async ({ client, assert }) => {
    const response = await client
      .post(`/admin/organizations/${testOrg.id}/suspend`)
      .json({ reason: 'Policy violation' })
      .loginAs(adminUser)

    response.assertStatus(200)
    
    await testOrg.refresh()
    assert.equal(testOrg.status, 'suspended')
  })

  test('admin can reactivate organization', async ({ client, assert }) => {
    const response = await client
      .post(`/admin/organizations/${testOrg.id}/reactivate`)
      .loginAs(adminUser)

    response.assertStatus(200)
    
    await testOrg.refresh()
    assert.equal(testOrg.status, 'active')
  })

  test('admin can archive organization', async ({ client, assert }) => {
    const response = await client
      .post(`/admin/organizations/${testOrg.id}/archive`)
      .loginAs(adminUser)

    response.assertStatus(200)
    
    await testOrg.refresh()
    assert.equal(testOrg.status, 'archived')
  })

  test('admin can list all users', async ({ client, assert }) => {
    const response = await client
      .get('/admin/users')
      .loginAs(adminUser)

    response.assertStatus(200)
    assert.property(response.body(), 'data')
  })

  test('admin can disable a user', async ({ client, assert }) => {
    const response = await client
      .post(`/admin/users/${regularUser.id}/disable`)
      .json({ reason: 'Terms violation' })
      .loginAs(adminUser)

    response.assertStatus(200)
    
    await regularUser.refresh()
    assert.equal(regularUser.isDisabled, true)
  })

  test('admin can enable a user', async ({ client, assert }) => {
    const response = await client
      .post(`/admin/users/${regularUser.id}/enable`)
      .loginAs(adminUser)

    response.assertStatus(200)
    
    await regularUser.refresh()
    assert.equal(regularUser.isDisabled, false)
  })

  test('admin cannot disable themselves', async ({ client }) => {
    const response = await client
      .post(`/admin/users/${adminUser.id}/disable`)
      .json({ reason: 'Test' })
      .loginAs(adminUser)

    response.assertStatus(400)
    response.assertBodyContains({ error: { message: 'Cannot disable your own account' } })
  })

  test('admin can view system analytics', async ({ client, assert }) => {
    const response = await client
      .get('/admin/analytics')
      .qs({ range: '30days' })
      .loginAs(adminUser)

    response.assertStatus(200)
    assert.property(response.body(), 'userGrowth')
    assert.property(response.body(), 'organizationGrowth')
  })

  test('admin can view recent activity', async ({ client, assert }) => {
    const response = await client
      .get('/admin/activity')
      .loginAs(adminUser)

    response.assertStatus(200)
  })

  test('admin can export summary', async ({ client }) => {
    const response = await client
      .get('/admin/export')
      .qs({ format: 'json' })
      .loginAs(adminUser)

    response.assertStatus(200)
  })
})

test.group('Volunteer Panel', (group) => {
  let volunteerUser: User
  let testOrg: Organization
  let testOpportunity: Opportunity

  group.setup(async () => {
    // Create volunteer user
    volunteerUser = await User.create({
      email: 'volunteer@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Volunteer'
    })

    // Create test organization
    testOrg = await Organization.create({
      name: 'Volunteer Test Org',
      slug: 'volunteer-test-org',
      status: 'active'
    })

    // Create test opportunity
    testOpportunity = await Opportunity.create({
      organizationId: testOrg.id,
      title: 'Test Volunteer Opportunity',
      slug: 'test-volunteer-opp',
      description: 'A test opportunity',
      status: 'published',
      visibility: 'public',
      startAt: new Date(Date.now() + 86400000), // Tomorrow
      endAt: new Date(Date.now() + 90000000)
    })
  })

  group.teardown(async () => {
    await Database.rawQuery('DELETE FROM applications WHERE opportunity_id = ?', [testOpportunity?.id])
    await Database.rawQuery('DELETE FROM opportunities WHERE slug LIKE ?', ['test-volunteer%'])
    await Database.rawQuery('DELETE FROM organization_volunteers WHERE organization_id = ?', [testOrg?.id])
    await Database.rawQuery('DELETE FROM organizations WHERE slug LIKE ?', ['volunteer-test%'])
    await Database.rawQuery('DELETE FROM users WHERE email = ?', ['volunteer@test.com'])
  })

  test('volunteer can view dashboard', async ({ client, assert }) => {
    const response = await client
      .get('/volunteer/dashboard')
      .loginAs(volunteerUser)

    response.assertStatus(200)
    assert.property(response.body(), 'stats')
    assert.property(response.body(), 'upcomingEvents')
  })

  test('volunteer can view profile', async ({ client, assert }) => {
    const response = await client
      .get('/volunteer/profile')
      .loginAs(volunteerUser)

    response.assertStatus(200)
    assert.equal(response.body().email, 'volunteer@test.com')
  })

  test('volunteer can update profile', async ({ client, assert }) => {
    const response = await client
      .put('/volunteer/profile')
      .json({
        firstName: 'Updated',
        lastName: 'Name',
        phone: '555-1234'
      })
      .loginAs(volunteerUser)

    response.assertStatus(200)
    assert.equal(response.body().firstName, 'Updated')
  })

  test('volunteer can browse opportunities', async ({ client, assert }) => {
    const response = await client
      .get('/volunteer/opportunities')
      .loginAs(volunteerUser)

    response.assertStatus(200)
  })

  test('volunteer can view opportunity detail', async ({ client, assert }) => {
    const response = await client
      .get(`/volunteer/opportunities/${testOpportunity.id}`)
      .loginAs(volunteerUser)

    response.assertStatus(200)
    assert.equal(response.body().title, 'Test Volunteer Opportunity')
  })

  test('volunteer can view their applications', async ({ client }) => {
    const response = await client
      .get('/volunteer/applications')
      .loginAs(volunteerUser)

    response.assertStatus(200)
  })

  test('volunteer can view their attendance', async ({ client }) => {
    const response = await client
      .get('/volunteer/attendance')
      .loginAs(volunteerUser)

    response.assertStatus(200)
  })

  test('volunteer can view their hours', async ({ client, assert }) => {
    const response = await client
      .get('/volunteer/hours')
      .loginAs(volunteerUser)

    response.assertStatus(200)
    assert.property(response.body(), 'summary')
  })

  test('volunteer can view their organizations', async ({ client }) => {
    const response = await client
      .get('/volunteer/organizations')
      .loginAs(volunteerUser)

    response.assertStatus(200)
  })

  test('volunteer can join an organization', async ({ client }) => {
    const response = await client
      .post(`/volunteer/organizations/${testOrg.id}/join`)
      .loginAs(volunteerUser)

    response.assertStatus(200)
  })

  test('volunteer cannot join same organization twice', async ({ client }) => {
    const response = await client
      .post(`/volunteer/organizations/${testOrg.id}/join`)
      .loginAs(volunteerUser)

    response.assertStatus(400)
    response.assertBodyContains({ error: { message: 'Already a member of this organization' } })
  })

  test('volunteer can leave an organization', async ({ client }) => {
    const response = await client
      .delete(`/volunteer/organizations/${testOrg.id}/leave`)
      .loginAs(volunteerUser)

    response.assertStatus(200)
  })

  test('volunteer can bookmark an opportunity', async ({ client }) => {
    const response = await client
      .post(`/volunteer/opportunities/${testOpportunity.id}/bookmark`)
      .loginAs(volunteerUser)

    response.assertStatus(200)
  })

  test('volunteer can view bookmarked opportunities', async ({ client, assert }) => {
    const response = await client
      .get('/volunteer/bookmarks')
      .loginAs(volunteerUser)

    response.assertStatus(200)
    assert.property(response.body(), 'opportunities')
  })

  test('volunteer can unbookmark an opportunity', async ({ client }) => {
    const response = await client
      .delete(`/volunteer/opportunities/${testOpportunity.id}/bookmark`)
      .loginAs(volunteerUser)

    response.assertStatus(200)
  })

  test('volunteer can view their achievements', async ({ client, assert }) => {
    const response = await client
      .get('/volunteer/achievements')
      .loginAs(volunteerUser)

    response.assertStatus(200)
    assert.property(response.body(), 'achievements')
    assert.property(response.body(), 'totalPoints')
  })
})

test.group('Permission Model', (group) => {
  let adminUser: User
  let orgOwner: User
  let orgAdmin: User
  let manager: User
  let coordinator: User
  let volunteer: User
  let testOrg: Organization

  group.setup(async () => {
    // Create users with different roles
    adminUser = await User.create({
      email: 'perm-admin@test.com',
      password: 'password123',
      firstName: 'Platform',
      lastName: 'Admin',
      isAdmin: true
    })

    orgOwner = await User.create({
      email: 'perm-owner@test.com',
      password: 'password123',
      firstName: 'Org',
      lastName: 'Owner'
    })

    orgAdmin = await User.create({
      email: 'perm-orgadmin@test.com',
      password: 'password123',
      firstName: 'Org',
      lastName: 'Admin'
    })

    manager = await User.create({
      email: 'perm-manager@test.com',
      password: 'password123',
      firstName: 'Org',
      lastName: 'Manager'
    })

    coordinator = await User.create({
      email: 'perm-coordinator@test.com',
      password: 'password123',
      firstName: 'Org',
      lastName: 'Coordinator'
    })

    volunteer = await User.create({
      email: 'perm-volunteer@test.com',
      password: 'password123',
      firstName: 'Regular',
      lastName: 'Volunteer'
    })

    // Create test organization
    testOrg = await Organization.create({
      name: 'Permission Test Org',
      slug: 'permission-test-org',
      status: 'active'
    })

    // Add users to organization with different roles
    await Database.table('organization_volunteers').insert([
      { organization_id: testOrg.id, user_id: orgOwner.id, role: 'owner', status: 'active', joined_at: new Date() },
      { organization_id: testOrg.id, user_id: orgAdmin.id, role: 'admin', status: 'active', joined_at: new Date() },
      { organization_id: testOrg.id, user_id: manager.id, role: 'manager', status: 'active', joined_at: new Date() },
      { organization_id: testOrg.id, user_id: coordinator.id, role: 'coordinator', status: 'active', joined_at: new Date() },
      { organization_id: testOrg.id, user_id: volunteer.id, role: 'volunteer', status: 'active', joined_at: new Date() }
    ])
  })

  group.teardown(async () => {
    await Database.rawQuery('DELETE FROM organization_volunteers WHERE organization_id = ?', [testOrg?.id])
    await Database.rawQuery('DELETE FROM organizations WHERE slug = ?', ['permission-test-org'])
    await Database.rawQuery('DELETE FROM users WHERE email LIKE ?', ['perm-%@test.com'])
  })

  test('super admin can access admin panel', async ({ client }) => {
    const response = await client
      .get('/admin/dashboard')
      .loginAs(adminUser)

    response.assertStatus(200)
  })

  test('org owner cannot access admin panel', async ({ client }) => {
    const response = await client
      .get('/admin/dashboard')
      .loginAs(orgOwner)

    response.assertStatus(401)
  })

  test('volunteer cannot access admin panel', async ({ client }) => {
    const response = await client
      .get('/admin/dashboard')
      .loginAs(volunteer)

    response.assertStatus(401)
  })

  test('all users can access volunteer panel', async ({ client }) => {
    // Volunteer
    const volResponse = await client
      .get('/volunteer/dashboard')
      .loginAs(volunteer)
    volResponse.assertStatus(200)

    // Manager
    const mgrResponse = await client
      .get('/volunteer/dashboard')
      .loginAs(manager)
    mgrResponse.assertStatus(200)

    // Admin
    const adminResponse = await client
      .get('/volunteer/dashboard')
      .loginAs(adminUser)
    adminResponse.assertStatus(200)
  })
})
