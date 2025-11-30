import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Course from 'App/Models/Course'
import Database from '@ioc:Adonis/Lucid/Database'
import CourseEnrollment from 'App/Models/CourseEnrollment'

export default class CoursesController {
  public async index({ response }: HttpContextContract) {
    const courses = await Course.query().preload('enrollments', (e) => e.preload('user'))
    // add helper fields for client convenience
    const payload = courses.map((c) => ({
      ...c.toJSON(),
      assigned_count: (c.enrollments || []).length,
      assign_all: c.assignAll || false
    }))
    return response.ok(payload)
  }

  public async store({ request, response }: HttpContextContract) {
    const data = request.only([
      'title',
      'description',
      'description_html',
      'instructor',
      'startAt',
      'endAt',
      'capacity',
      'assign_all',
      'assigned_user_ids'
    ])
    // extract assignment fields and normalize keys for the Course model
    const assignedUserIds = data.assigned_user_ids || request.input('assigned_user_ids') || []
    delete data.assigned_user_ids
    const assignAllInput = request.input('assign_all')
    if (assignAllInput !== undefined) {
      data.assignAll = !!assignAllInput
    }
    if (data.description_html) {
      data.descriptionHtml = data.description_html
      delete data.description_html
    }

    const course = await Course.create(data)

    // handle assignments
    const assignAll = !!assignAllInput

    if (assignAll) {
      const users = await Database.from('users').select('id').where('is_disabled', false)
      const rows = users.map((u: any) => ({ course_id: course.id, user_id: u.id }))
      if (rows.length) await Database.table('course_enrollments').insert(rows)
    } else if (Array.isArray(assignedUserIds) && assignedUserIds.length) {
      const valid = await Database.from('users').whereIn('id', assignedUserIds).select('id')
      const rows = valid.map((u: any) => ({ course_id: course.id, user_id: u.id }))
      if (rows.length) await Database.table('course_enrollments').insert(rows)
    }

    await course.load('enrollments', (q) => q.preload('user'))
    return response.created({
      ...course.toJSON(),
      assigned_count: course.enrollments.length,
      assign_all: !!data.assign_all
    })
  }

  public async show({ params, response }: HttpContextContract) {
    const course = await Course.query()
      .where('id', params.id)
      .preload('enrollments', (e) => e.preload('user'))
      .firstOrFail()
    return response.ok({
      ...course.toJSON(),
      assigned_count: (course.enrollments || []).length,
      assign_all: course.assignAll || false
    })
  }

  public async update({ params, request, response }: HttpContextContract) {
    const course = await Course.findOrFail(params.id)
    const data = request.only([
      'title',
      'description',
      'description_html',
      'instructor',
      'startAt',
      'endAt',
      'capacity',
      'status',
      'assign_all',
      'assigned_user_ids'
    ])
    // normalize incoming keys so we don't try to set unknown model properties
    const assignedUserIds = data.assigned_user_ids || request.input('assigned_user_ids')
    delete data.assigned_user_ids
    const assignAllInput = request.input('assign_all')
    if (assignAllInput !== undefined) data.assignAll = !!assignAllInput
    if (data.description_html) {
      data.descriptionHtml = data.description_html
      delete data.description_html
    }

    course.merge(data)
    await course.save()

    // sync enrollments if provided (use normalized values)
    const assignAll = !!assignAllInput

    if (assignAll) {
      // clear existing and enroll all active users
      await Database.from('course_enrollments').where('course_id', course.id).delete()
      const users = await Database.from('users').select('id').where('is_disabled', false)
      const rows = users.map((u: any) => ({ course_id: course.id, user_id: u.id }))
      if (rows.length) await Database.table('course_enrollments').insert(rows)
    } else if (Array.isArray(assignedUserIds)) {
      await Database.from('course_enrollments').where('course_id', course.id).delete()
      const valid = await Database.from('users').whereIn('id', assignedUserIds).select('id')
      const rows = valid.map((u: any) => ({ course_id: course.id, user_id: u.id }))
      if (rows.length) await Database.table('course_enrollments').insert(rows)
    }

    await course.load('enrollments')
    return response.ok({
      ...course.toJSON(),
      assigned_count: course.enrollments.length,
      assign_all: !!data.assign_all
    })
  }

  public async destroy({ params, response }: HttpContextContract) {
    const course = await Course.findOrFail(params.id)
    await course.delete()
    return response.noContent()
  }
}
