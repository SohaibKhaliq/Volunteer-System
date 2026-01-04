import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'

test.group('Organization registration and onboarding', (group) => {
  group.teardown(async () => {
    await Organization.query().where('name', 'like', 'Test Org%').delete()
    await User.query().where('email', 'like', '%test-org-register%').delete()
  })

  test('organization can register with pending status', async ({ client, assert }) => {
    const registerData = {
      email: `test-org-register-${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'Test',
      lastName: 'Organization',
      role: 'organization',
      name: 'Test Org Registration',
      description: 'A test organization',
      phone: '+1234567890',
      address: '123 Test St'
    }

    const response = await client.post('/register').json(registerData)
    
    // Log the response for debugging
    if (response.status() !== 200) {
      console.log('Registration failed:', response.body())
    }
    
    response.assertStatus(200)
    const body = response.body()
    
    assert.exists(body.token, 'Token should be returned')
    assert.equal(body.status, 'pending', 'Organization should be pending')
    assert.exists(body.message, 'Message should indicate pending approval')

    // Verify organization was created with correct status
    const org = await Organization.query()
      .where('name', registerData.name)
      .first()
    
    assert.exists(org, 'Organization should be created')
    assert.equal(org?.status, 'pending', 'Org status should be pending')
    assert.equal(org?.isApproved, false, 'Org should not be approved')
    assert.equal(org?.isActive, false, 'Org should not be active')
    assert.equal(org?.contactEmail, registerData.email)

    // Verify user was created and linked
    const user = await User.query()
      .where('email', registerData.email)
      .first()
    
    assert.exists(user, 'User should be created')
    assert.equal(org?.ownerId, user?.id, 'Organization should be linked to user')
  })

  test('admin can approve organization', async ({ client, assert }) => {
    // Create admin user
    const admin = await User.create({
      email: 'admin-approve-org@test.com',
      password: 'adminpass',
      isAdmin: true,
      firstName: 'Test',
      lastName: 'Admin'
    })

    // Create pending organization
    const org = await Organization.create({
      name: 'Test Org for Approval',
      status: 'pending',
      isApproved: false,
      isActive: false,
      contactEmail: 'org@test.com'
    })

    // Admin approves the organization
    const approveResp = await client
      .loginAs(admin)
      .post(`/admin/organizations/${org.id}/approve`)
      .json()

    approveResp.assertStatus(200)

    // Verify organization is now approved and active
    await org.refresh()
    assert.equal(org.status, 'active', 'Organization status should be active')
    assert.equal(org.isApproved, true, 'Organization should be approved')
  })

  test('regular user registration without role does not create organization', async ({ client, assert }) => {
    const registerData = {
      email: 'regular-user@example.com',
      password: 'password123',
      firstName: 'Regular',
      lastName: 'User'
    }

    const response = await client.post('/register').json(registerData)

    response.assertStatus(200)
    const body = response.body()
    
    assert.exists(body.token, 'Token should be returned')
    assert.notExists(body.status, 'No status for regular user')

    // Verify no organization was created
    const orgs = await Organization.query()
      .where('contact_email', registerData.email)
      .exec()
    
    assert.equal(orgs.length, 0, 'No organization should be created for regular user')
  })
})
