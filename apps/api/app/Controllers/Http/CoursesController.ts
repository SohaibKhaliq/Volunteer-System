import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Course from 'App/Models/Course'

export default class CoursesController {
  public async index({ response }: HttpContextContract) {
    const courses = await Course.query().preload('enrollments')
    return response.ok(courses)
  }

  public async store({ request, response }: HttpContextContract) {
    const data = request.only(['title', 'description', 'instructor', 'startAt', 'endAt', 'capacity'])
    const course = await Course.create(data)
    return response.created(course)
  }

  public async show({ params, response }: HttpContextContract) {
    const course = await Course.query().where('id', params.id).preload('enrollments').firstOrFail()
    return response.ok(course)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const course = await Course.findOrFail(params.id)
    const data = request.only(['title', 'description', 'instructor', 'startAt', 'endAt', 'capacity', 'status'])
    course.merge(data)
    await course.save()
    return response.ok(course)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const course = await Course.findOrFail(params.id)
    await course.delete()
    return response.noContent()
  }
}
