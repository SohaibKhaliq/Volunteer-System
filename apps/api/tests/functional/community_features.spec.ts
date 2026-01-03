import { test } from '@japa/runner'
import User from 'App/Models/User'
import Broadcast from 'App/Models/Broadcast'
import Survey from 'App/Models/Survey'
import Course from 'App/Models/Course'
import Communication from 'App/Models/Communication'
import CommunicationLog from 'App/Models/CommunicationLog'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

test.group('Community & Communications Controllers', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  // ==========================================
  // BroadcastsController Tests
  // ==========================================
  test('broadcast: admin can create and list', async ({ client, assert }) => {
    const admin = await User.create({ email: `bc-adm-${Date.now()}@test.com`, password: 'pass', isAdmin: true })
    
    // Create
    const createResp = await client.loginAs(admin).post('/admin/broadcasts').json({
      title: 'Alert',
      message: 'System update',
      priority: 'high',
      targetType: 'all'
    })
    createResp.assertStatus(201)
    const bcId = createResp.body().id

    // List
    const listResp = await client.loginAs(admin).get('/admin/broadcasts')
    listResp.assertStatus(200)
    assert.isTrue(listResp.body().data.some((b: any) => b.id === bcId))
  })

  test('broadcast: non-admin cannot access', async ({ client }) => {
    const user = await User.create({ email: `bc-user-${Date.now()}@test.com`, password: 'pass', isAdmin: false })
    const resp = await client.loginAs(user).get('/admin/broadcasts')
    resp.assertStatus(401) // Controller returns 401 Unauthorized for access denied
  })

  // ==========================================
  // SurveysController Tests
  // ==========================================
  test('survey: create and submit response', async ({ client, assert }) => {
    const user = await User.create({ email: `surv-user-${Date.now()}@test.com`, password: 'pass' })
    const admin = await User.create({ email: `surv-adm-${Date.now()}@test.com`, password: 'pass', isAdmin: true })

    // Create Survey
    const survResp = await client.loginAs(admin).post('/surveys').json({
      title: 'Feedback',
      description: 'Give us feedback',
      questions: [{ id: 'q1', question: 'Rate us', type: 'rating' }],
      status: 'Open',
      settings: { allowMultipleResponses: true }
    })
    survResp.assertStatus(201)
    const surveyId = survResp.body().id

    // Submit Response
    const subResp = await client.loginAs(user).post(`/surveys/${surveyId}/submit`).json({
      answers: { q1: 5 }
    })
    subResp.assertStatus(201)

    // Verify submission
    const responses = await client.loginAs(admin).get(`/surveys/${surveyId}/responses`)
    responses.assertStatus(200)
    assert.lengthOf(responses.body(), 1)
  })

  test('survey: export responses as csv', async ({ client, assert }) => {
    const admin = await User.create({ email: `surv-exp-${Date.now()}@test.com`, password: 'pass', isAdmin: true })
    const survey = await Survey.create({ title: 'Export Test', status: 'Open', createdBy: admin.id })
    
    await client.loginAs(admin).post(`/surveys/${survey.id}/submit`).json({ answers: { a: 1 } })

    const resp = await client.loginAs(admin).get(`/surveys/${survey.id}/responses/export`)
    resp.assertStatus(200)
    assert.include(resp.header('content-type'), 'text/csv')
    assert.include(resp.text(), 'user_email')
  })

  // ==========================================
  // CoursesController Tests
  // ==========================================
  test('course: create with assign_all enrolls users', async ({ client, assert }) => {
    // Create some users first
    const u1 = await User.create({ email: `c-u1-${Date.now()}@test.com`, password: 'pass' })
    const u2 = await User.create({ email: `c-u2-${Date.now()}@test.com`, password: 'pass' })
    
    // Ensure they are not disabled? Controller filters where is_disabled false.
    // Default is likely false but migration checking might be good. Assuming default false.

    const admin = await User.create({ email: `c-adm-${Date.now()}@test.com`, password: 'pass', isAdmin: true })

    const resp = await client.loginAs(admin).post('/courses').json({
      title: 'Safety 101',
      description: 'Mandatory',
      assign_all: true
    })

    resp.assertStatus(201)
    const courseId = resp.body().id
    
    const course = await Course.find(courseId)
    await course?.load('enrollments')
    
    // Should enroll u1, u2 and admin at least
    assert.isTrue(course!.enrollments.length >= 3)
  })

  test('course: update assignments', async ({ client, assert }) => {
    const u1 = await User.create({ email: `cs-u1-${Date.now()}@test.com`, password: 'pass' })
    const admin = await User.create({ email: `cs-adm-${Date.now()}@test.com`, password: 'pass', isAdmin: true })
    
    const course = await Course.create({ title: 'Manual Assign' })

    const resp = await client.loginAs(admin).put(`/courses/${course.id}`).json({
      assigned_user_ids: [u1.id]
    })

    resp.assertStatus(200)
    assert.equal(resp.body().assigned_count, 1)
  })

  // ==========================================
  // CommunicationsController Tests
  // ==========================================
  test('comm: create and retry log', async ({ client, assert }) => {
    const admin = await User.create({ email: `comm-adm-${Date.now()}@test.com`, password: 'pass', isAdmin: true })

    // Create Comm
    const commResp = await client.loginAs(admin).post('/communications').json({
      subject: 'Newsletter',
      content: 'Hello',
      type: 'Email',
      status: 'Ready'
    })
    commResp.assertStatus(200) // Store returns object, 200 default? Controller returns body directly.
    // Actually controller returns `return comm`, Adonis default for returning model is 200.
    
    const commId = commResp.body().id

    // Create a dummy failed log manually since we can't easily trigger async send failure in test without mocking
    const log = await CommunicationLog.create({
      communicationId: commId,
      recipient: 'test@example.com',
      status: 'Failed',
      attempts: 1
    })

    // Retry
    const retryResp = await client.loginAs(admin).post(`/communications/logs/${log.id}/retry`)
    retryResp.assertStatus(200)
    assert.equal(retryResp.body().status, 'Success')
    
    await log.refresh()
    assert.equal(log.status, 'Success')
    assert.equal(log.attempts, 2)
  })
})
