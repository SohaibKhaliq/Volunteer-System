import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Survey from 'App/Models/Survey'

export default class SurveysController {
  public async index({}: HttpContextContract) {
    return Survey.query().preload('responses')
  }

  public async store({ request }: HttpContextContract) {
    const data = request.only(['title', 'description', 'status'])
    return Survey.create(data)
  }

  public async show({ params }: HttpContextContract) {
    return Survey.query().where('id', params.id).preload('responses').firstOrFail()
  }

  public async update({ params, request }: HttpContextContract) {
    const survey = await Survey.findOrFail(params.id)
    const data = request.only(['title', 'description', 'status'])
    survey.merge(data)
    await survey.save()
    return survey
  }

  public async destroy({ params }: HttpContextContract) {
    const survey = await Survey.findOrFail(params.id)
    await survey.delete()
  }
}
