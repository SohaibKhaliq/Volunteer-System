
import { test } from '@japa/runner'
import User from 'App/Models/User'
import ComplianceDocument from 'App/Models/ComplianceDocument'
import { DateTime } from 'luxon'

test.group('User Compliance Status', (group) => {
  group.teardown(async () => {
    // Cleanup
    await User.query().where('email', 'like', '%compliance-test%').delete()
  })

  test('admin users list returns correct compliance status', async ({ client, assert }) => {
    const admin = await User.create({
      email: `admin-compliance-test-${Math.floor(Math.random() * 1000)}@test.com`,
      password: 'password',
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true
    })

    // Case 1: User with Expired Document
    const userExpired = await User.create({
      email: `expired-compliance-test-${Math.floor(Math.random() * 1000)}@test.com`,
      password: 'password',
      firstName: 'Expired',
      lastName: 'User'
    })
    await ComplianceDocument.create({
      userId: userExpired.id,
      docType: 'wwcc',
      status: 'expired',
      expiresAt: DateTime.now().minus({ days: 1 })
    })

    // Case 2: User with Pending Document
    const userPending = await User.create({
      email: `pending-compliance-test-${Math.floor(Math.random() * 1000)}@test.com`,
      password: 'password',
      firstName: 'Pending',
      lastName: 'User'
    })
    await ComplianceDocument.create({
      userId: userPending.id,
      docType: 'wwcc',
      status: 'pending'
    })

    // Case 3: User with Compliant Document
    const userCompliant = await User.create({
      email: `compliant-compliance-test-${Math.floor(Math.random() * 1000)}@test.com`,
      password: 'password',
      firstName: 'Compliant',
      lastName: 'User'
    })
    await ComplianceDocument.create({
      userId: userCompliant.id,
      docType: 'wwcc',
      status: 'approved',
      expiresAt: DateTime.now().plus({ days: 365 })
    })

    // Case 4: User with No Documents (Default Pending)
    const userNone = await User.create({
      email: `none-compliance-test-${Math.floor(Math.random() * 1000)}@test.com`,
      password: 'password',
      firstName: 'None',
      lastName: 'User'
    })

    const response = await client
      .loginAs(admin)
      .get('/users')
      .qs({ search: 'compliance-test', perPage: 50 }) // Filter to our test users

    response.assertStatus(200)
    const users = response.body().data
    console.log('DEBUG: Users found:', users.length)
    console.log('DEBUG: User IDs:', users.map((u: any) => u.id))
    console.log('DEBUG: Created IDs:', [userExpired.id, userPending.id, userCompliant.id, userNone.id])

    const foundExpired = users.find((u: any) => u.id === userExpired.id)
    const foundPending = users.find((u: any) => u.id === userPending.id)
    const foundCompliant = users.find((u: any) => u.id === userCompliant.id)
    const foundNone = users.find((u: any) => u.id === userNone.id)

    assert.equal(foundExpired.complianceStatus, 'expired', 'User 1 should be expired')
    assert.equal(foundPending.complianceStatus, 'pending', 'User 2 should be pending')
    assert.equal(foundCompliant.complianceStatus, 'compliant', 'User 3 should be compliant')
    assert.equal(foundNone.complianceStatus, 'pending', 'User 4 with no docs should be pending')
  })
})
