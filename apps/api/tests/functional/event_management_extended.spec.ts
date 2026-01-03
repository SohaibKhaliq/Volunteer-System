import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import Event from 'App/Models/Event'
import Shift from 'App/Models/Shift'
import ShiftAssignment from 'App/Models/ShiftAssignment'
import Task from 'App/Models/Task'
import Resource from 'App/Models/Resource'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

test.group('Event Management Extended', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  // ==========================================
  // ShiftsController Tests
  // ==========================================
  test('shifts: create shift and check conflicts', async ({ client, assert }) => {
    const admin = await User.create({ email: `sh-adm-${Date.now()}@test.com`, password: 'pass', isAdmin: true })
    const org = await Organization.create({ name: 'Shift Org', type: 'Community' })
    const event = await Event.create({ title: 'Shift Event', organizationId: org.id, startAt: DateTime.now(), endAt: DateTime.now().plus({ days: 1 }) })

    // Create Shift
    const start = DateTime.now().plus({ hours: 1 })
    const end = start.plus({ hours: 4 }) // 4 hour shift

    const createResp = await client.loginAs(admin).post('/shifts').json({
      event_id: event.id,
      organization_id: org.id,
      title: 'Morning Shift',
      start_at: start.toFormat('yyyy-MM-dd HH:mm:ss'),
      end_at: end.toFormat('yyyy-MM-dd HH:mm:ss'),
      capacity: 5
    })
    createResp.assertStatus(200)
    const shiftId = createResp.body().id

    // Check conflict (empty initially)
    const volunteer = await User.create({ email: `vol-${Date.now()}@test.com`, password: 'pass' })
    const confResp = await client.loginAs(admin).post(`/shifts/${shiftId}/check-conflicts`).json({
      userId: volunteer.id
    })
    confResp.assertStatus(200)
    assert.isFalse(confResp.body().hasConflict)
  })

  test('shifts: recurring creation', async ({ client, assert }) => {
    const admin = await User.create({ email: `rec-adm-${Date.now()}@test.com`, password: 'pass' })
    const org = await Organization.create({ name: 'Rec Org', type: 'Community' })
    
    const start = DateTime.now().plus({ days: 1, hours: 9 })
    const end = start.plus({ hours: 4 })
    const recurrenceEnd = start.plus({ days: 7 })

    const resp = await client.loginAs(admin).post('/shifts/recurring').json({
      title: 'Daily Standup',
      organizationId: org.id,
      startAt: start.toISO(),
      endAt: end.toISO(),
      recurrenceRule: 'Daily', // Mock service usually handles 'Daily' or RRule string
      endDate: recurrenceEnd.toISODate()
    })

    // If service works, 201. If service mocking is complex/fails, check 500.
    // Assuming service is implemented to handle "Daily" or similar.
    // If it fails, I'll adjust expectation or mock.
    if (resp.status() === 500) {
       console.log('Recurring shift failed:', resp.body())
    }
    resp.assertStatus(201)
    assert.isAbove(resp.body().count, 0)
  })

  // ==========================================
  // ShiftAssignmentsController Tests
  // ==========================================
  test('assignments: assign, check-in, check-out details', async ({ client, assert }) => {
    const admin = await User.create({ email: `assign-adm-${Date.now()}@test.com`, password: 'pass' })
    const volunteer = await User.create({ email: `vol-assign-${Date.now()}@test.com`, password: 'pass' })
    const org = await Organization.create({ name: 'Assign Org', type: 'Community' })
    
    const start = DateTime.now().minus({ hours: 2 }) // Started 2 hours ago
    const end = DateTime.now().plus({ hours: 2 })
    
    const shift = await Shift.create({
      organizationId: org.id,
      title: 'Active Shift',
      startAt: start,
      endAt: end,
      capacity: 3
    })

    // Assign
    const assignResp = await client.loginAs(admin).post('/shift-assignments').json({
      shift_id: shift.id,
      user_id: volunteer.id,
      status: 'confirmed'
    })
    assignResp.assertStatus(200)
    
    // Check In (by volunteer)
    const checkInResp = await client.loginAs(volunteer).post('/volunteer/attendance/checkin').json({
      shiftId: shift.id
    })
    checkInResp.assertStatus(200)
    assert.equal(checkInResp.body().status, 'in-progress')

    // Check Out (by volunteer)
    const checkOutResp = await client.loginAs(volunteer).post('/volunteer/attendance/checkout').json({
      shiftId: shift.id
    })
    checkOutResp.assertStatus(200)
    assert.equal(checkOutResp.body().status, 'completed')
    // Verify hours logged (approx 0.0 or small since checkout immediately after checkin)
    // Actually test waited 0 time, so diff is ~0.
  })

  // ==========================================
  // TasksController Tests
  // ==========================================
  test('tasks: crud', async ({ client, assert }) => {
    const admin = await User.create({ email: `task-adm-${Date.now()}@test.com`, password: 'pass' })
    const event = await Event.create({ title: 'Task Event', startAt: DateTime.now(), endAt: DateTime.now() })
    
    // Create
    const createResp = await client.loginAs(admin).post('/tasks').json({
      event_id: event.id,
      title: 'Setup',
      slot_count: 2,
      priority: 'high'
    })
    createResp.assertStatus(201)
    const taskId = createResp.body().id

    // Update
    const updateResp = await client.loginAs(admin).put(`/tasks/${taskId}`).json({
      status: 'completed'
    })
    updateResp.assertStatus(200)
    assert.equal(updateResp.body().status, 'completed')

    // List
    const listResp = await client.loginAs(admin).get('/tasks').qs({ event_id: event.id })
    listResp.assertStatus(200)
    assert.lengthOf(listResp.body(), 1)
  })

  // ==========================================
  // ResourcesController Tests (Basic)
  // ==========================================
  test('resources: create and manage', async ({ client, assert }) => {
    const admin = await User.create({ email: `res-adm-${Date.now()}@test.com`, password: 'pass', isAdmin: true })
    const org = await Organization.create({ name: 'Res Org', type: 'Community' })

    // Create
    const createResp = await client.loginAs(admin).post('/resources').json({
      name: 'Projector',
      type: 'Equipment',
      organization_id: org.id,
      status: 'available',
      quantity: 1
    })
    createResp.assertStatus(200)
    const resId = createResp.body().id

    // Status update
    const patchResp = await client.loginAs(admin).patch(`/resources/${resId}/status`).json({
      status: 'maintenance'
    })
    patchResp.assertStatus(200)
    
    await Resource.find(resId).then(r => {
      assert.equal(r?.status, 'maintenance')
    })
  })
})
