import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Survey from 'App/Models/Survey'
import SurveyResponse from 'App/Models/SurveyResponse'
import Logger from '@ioc:Adonis/Core/Logger'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class SurveysController {
  public async index({}: HttpContextContract) {
    return Survey.query().preload('responses')
  }

  public async store({ request, auth, response }: HttpContextContract) {
    const validationSchema = schema.create({
      title: schema.string({}, [rules.maxLength(255)]),
      description: schema.string.optional(),
      questions: schema.string.optional(),
      status: schema.string.optional()
    })

    try {
      const payload = await request.validate({ schema: validationSchema })
      const survey = await Survey.create({
        title: payload.title,
        description: payload.description,
        questions: payload.questions,
        status: payload.status || 'Open',
        createdBy: auth.user?.id
      })
      return response.created(survey)
    } catch (err) {
      Logger.error('Failed to create survey: %s', String(err))
      return response.status(400).send({ error: 'Invalid payload', details: String(err) })
    }
  }

  public async show({ params }: HttpContextContract) {
    return Survey.findOrFail(params.id)
  }

  public async update({ params, request }: HttpContextContract) {
    const s = await Survey.findOrFail(params.id)
    const data = request.only(['title', 'description', 'questions', 'status', 'settings'])
    s.merge(data)
    await s.save()
    return s
  }

  public async destroy({ params }: HttpContextContract) {
    const s = await Survey.findOrFail(params.id)
    await s.delete()
  }

  // submit a response to a survey
  public async submit({ params, request, auth, response }: HttpContextContract) {
    const survey = await Survey.find(params.id)
    if (!survey) return response.notFound()
    if (survey.status !== 'Open') return response.status(400).send({ error: 'Survey not open' })

    const payload = request.only(['answers'])
    const answers = payload.answers ? JSON.stringify(payload.answers) : null

    const r = await SurveyResponse.create({
      surveyId: survey.id,
      userId: auth.user?.id,
      answers,
      ipAddress: request.ip()
    })

    return response.created(r)
  }

  public async responses({ params }: HttpContextContract) {
    const survey = await Survey.findOrFail(params.id)
    const rows = await SurveyResponse.query()
      .where('survey_id', survey.id)
      .orderBy('created_at', 'desc')
    return rows
  }

  public async exportResponses({ params, response }: HttpContextContract) {
    const survey = await Survey.findOrFail(params.id)
    const rows = await SurveyResponse.query()
      .where('survey_id', survey.id)
      .orderBy('created_at', 'desc')
    // simple CSV
    const cols = ['id', 'userId', 'answers', 'ipAddress', 'createdAt']
    const csv = [cols.join(',')]
      .concat(
        rows.map((r: any) =>
          cols
            .map((c) => {
              const v = r[c] ?? r[c === 'createdAt' ? 'created_at' : c]
              if (v === null || v === undefined) return ''
              return `"${String(v).replace(/"/g, '""')}"`
            })
            .join(',')
        )
      )
      .join('\n')

    response.header('Content-Type', 'text/csv')
    response.header(
      'Content-Disposition',
      `attachment; filename="survey-${survey.id}-responses-${Date.now()}.csv"`
    )
    return response.send(csv)
  }
}

