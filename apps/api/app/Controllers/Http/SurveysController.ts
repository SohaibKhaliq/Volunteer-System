import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Survey from 'App/Models/Survey'
import SurveyResponse from 'App/Models/SurveyResponse'
import Notification from 'App/Models/Notification'
import User from 'App/Models/User'
import Logger from '@ioc:Adonis/Core/Logger'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class SurveysController {
  public async index({}: HttpContextContract) {
    return Survey.query().preload('responses')
  }

  public async store({ request, auth, response }: HttpContextContract) {
    // Allow richer question metadata: { id?, question, type, options?, required?, scale? }
    const validationSchema = schema.create({
      title: schema.string({}, [rules.maxLength(255)]),
      description: schema.string.optional(),
      questions: schema.array.optional().members(
        schema.object().members({
          id: schema.string.optional(),
          question: schema.string({}, [rules.maxLength(1000)]),
          type: schema.string({}, [
            rules.regex(/^(short_text|long_text|rating|multiple_choice|checkbox|likert)$/)
          ]),
          options: schema.array.optional().members(schema.string()),
          required: schema.boolean.optional(),
          scale: schema.number.optional()
        })
      ),
      status: schema.string.optional(),
      settings: schema.any.optional()
    })

    try {
      const payload = await request.validate({ schema: validationSchema })
      const survey = await Survey.create({
        title: payload.title,
        description: payload.description,
        questions: payload.questions || [],
        status: payload.status || 'Draft',
        settings: payload.settings ? JSON.stringify(payload.settings) : undefined,
        createdBy: auth.user?.id
      })

      // If survey is published on create, notify volunteers (best-effort)
      if (survey.status === 'Open') {
        try {
          const volunteers = await User.query().where('is_admin', false).select('id')
          for (const v of volunteers) {
            await Notification.create({
              userId: v.id,
              type: 'survey.published',
              payload: JSON.stringify({ surveyId: survey.id, title: survey.title }),
              read: false
            })
          }
        } catch (e) {
          Logger.warn('Failed to notify volunteers on publish: %s', String(e))
        }
      }

      return response.created(survey)
    } catch (err) {
      Logger.error('Failed to create survey: %s', String(err))
      return response.status(400).send({ error: 'Invalid payload', details: String(err) })
    }
  }

  public async show({ params }: HttpContextContract) {
    return Survey.findOrFail(params.id)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const s = await Survey.findOrFail(params.id)

    // Allow partial updates. Be tolerant with `questions` on update: accept an array or a JSON string.
    try {
      const data = request.only(['title', 'description', 'status']) as any

      const rawSettings = request.input('settings')
      if (rawSettings !== undefined) {
        data.settings = typeof rawSettings === 'string' ? rawSettings : JSON.stringify(rawSettings)
      }

      const rawQuestions = request.input('questions')
      if (rawQuestions !== undefined) {
        try {
          if (typeof rawQuestions === 'string') {
            data.questions = JSON.parse(rawQuestions || '[]')
          } else if (Array.isArray(rawQuestions)) {
            data.questions = rawQuestions
          } else {
            // ignore invalid shapes
          }
        } catch (e) {
          Logger.warn('Invalid questions JSON during update: %s', String(e))
          return response.status(400).send({ error: 'Invalid questions format' })
        }
      }

      const oldStatus = s.status

      s.merge(data)
      await s.save()

      // If status changed to 'Open', notify volunteers
      try {
        if (
          (oldStatus || '').toString().toLowerCase() !== 'open' &&
          (s.status || '').toString().toLowerCase() === 'open'
        ) {
          const volunteers = await User.query().where('is_admin', false).select('id')
          for (const v of volunteers) {
            await Notification.create({
              userId: v.id,
              type: 'survey.published',
              payload: JSON.stringify({ surveyId: s.id, title: s.title }),
              read: false
            })
          }
        }
      } catch (e) {
        Logger.warn('Failed to notify volunteers on publish: %s', String(e))
      }

      return s
    } catch (err) {
      Logger.error('Failed to update survey: %s', String(err))
      // If it's a validation error from Adonis, include messages
      // err.messages is present for validation failures
      const details = err && err.messages ? err.messages : String(err)
      return response.status(400).send({ error: 'Invalid payload', details })
    }
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

    // parse settings to check single-response and anonymous flags
    let settings: any = {}
    try {
      settings = survey.settings ? JSON.parse(survey.settings) : {}
    } catch (e) {
      settings = {}
    }

    // enforce single response per user unless allowMultipleResponses is true
    if (!settings.allowMultipleResponses) {
      if (auth.user) {
        const existing = await SurveyResponse.query()
          .where('survey_id', survey.id)
          .where('user_id', auth.user.id)
          .first()
        if (existing) return response.status(400).send({ error: 'User already submitted response' })
      }
    }

    const payload = request.only(['answers'])
    const answers = payload.answers ? JSON.stringify(payload.answers) : null

    const r = await SurveyResponse.create({
      surveyId: survey.id,
      userId: settings.anonymous ? null : auth.user?.id,
      answers,
      ipAddress: request.ip()
    })

    // notify survey owner and admins about new response (best-effort)
    try {
      if (survey.createdBy) {
        await Notification.create({
          userId: survey.createdBy,
          type: 'survey.response',
          payload: JSON.stringify({ surveyId: survey.id, responseId: r.id }),
          read: false
        })
      }
      // also send to admins
      const admins = await User.query().where('is_admin', true).select('id')
      for (const a of admins) {
        // skip if same as createdBy
        if (a.id === survey.createdBy) continue
        await Notification.create({
          userId: a.id,
          type: 'survey.response',
          payload: JSON.stringify({ surveyId: survey.id, responseId: r.id }),
          read: false
        })
      }
    } catch (e) {
      Logger.warn('Failed to notify on new survey response: %s', String(e))
    }

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
      .preload('user')
      .orderBy('created_at', 'desc')

    const cols = ['id', 'user_id', 'user_email', 'answers', 'ip_address', 'created_at']
    const csv = [cols.join(',')]
      .concat(
        rows.map((r: any) =>
          cols
            .map((c) => {
              let v: any
              if (c === 'user_email') v = r.user ? r.user.email : ''
              else v = r[c] ?? r[c === 'created_at' ? 'created_at' : c]
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
