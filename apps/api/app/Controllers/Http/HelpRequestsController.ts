import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import Type from 'App/Models/Type'
import { HelpRequestStatus } from 'Contracts/status'
import { createHelpRequestSchema } from 'shared'
import HelpRequest from '../../Models/HelpRequest'
import TriageService from 'App/Services/TriageService'

export default class HelpRequestController {
  public async store({ request, response }: HttpContextContract) {
    try {
      const payload = request.only([
        'types',
        'location',
        'isOnSite',
        'description',
        'source',
        'email',
        'name',
        'phone',
        'files',
        'severity',
        'contactMethod',
        'consentGiven',
        'metaData'
      ])

      // Parse payload with validated schema (including defaults)
      const parsedPayload = createHelpRequestSchema.parse({
        ...payload,
        types: typeof payload.types === 'string' ? JSON.parse(payload.types) : payload.types,
        location: typeof payload.location === 'string' ? JSON.parse(payload.location) : payload.location,
        metaData: typeof payload.metaData === 'string' ? JSON.parse(payload.metaData) : payload.metaData,
        consentGiven: payload.consentGiven === 'true' || payload.consentGiven === true
      })

      // Handle files safely similar to other upload endpoints
      const uploadedFiles = request.files('files') || []
      const MAX_BYTES = 5 * 1024 * 1024 // 5MB
      const allowedExt = ['png', 'jpg', 'jpeg', 'pdf', 'txt', 'doc', 'docx']
      const placedFiles: Array<{ originalName: string; storedName: string; path: string }> = []

      for (const f of uploadedFiles) {
        if (!f) continue
        if (f.size && f.size > MAX_BYTES) {
          return response.badRequest({ message: 'One of the uploaded files is too large' })
        }
        const ext = (f.extname || '').toLowerCase()
        if (ext && !allowedExt.includes(ext)) {
          return response.badRequest({ message: 'Invalid file type uploaded' })
        }
        await f.moveToDisk('local', { dirname: 'help-requests' })
        placedFiles.push({
          originalName: f.clientName || '',
          storedName: f.fileName || '',
          path: `help-requests/${f.fileName}`
        })
      }

      // Triage Logic
      const urgencyScore = TriageService.calculateUrgencyScore({
        severity: parsedPayload.severity,
        description: parsedPayload.description,
        source: parsedPayload.source
      } as HelpRequest, parsedPayload.types)

      const caseId = TriageService.generateCaseId()

      const helpRequest = await HelpRequest.create({
        caseId,
        urgencyScore,
        severity: parsedPayload.severity,
        contactMethod: parsedPayload.contactMethod,
        consentGiven: parsedPayload.consentGiven,
        metaData: parsedPayload.metaData,
        isVerified: false,
        longitude: parsedPayload.location.lng,
        latitude: parsedPayload.location.lat,
        address: parsedPayload.location.address,
        description: parsedPayload.description,
        source: parsedPayload.source,
        status: HelpRequestStatus.Requested,
        name: parsedPayload.name,
        email: parsedPayload.email,
        phone: parsedPayload.phone,
        isOnSite: parsedPayload.isOnSite === 'yes',
        files: JSON.stringify(placedFiles)
      })

      const types = await Type.query().whereIn('type', parsedPayload.types).exec()

      await helpRequest.related('types').attach(types.map((type) => type.id))
      await helpRequest.load('types')
      return response.created(helpRequest)
    } catch (error) {
      Logger.error('Failed to create help request: %s', error.message)
      console.error(error)
      return response.badRequest({
        message: 'Failed to create help request',
        error: error.messages || error.message
      })
    }
  }

  public async update({ request, params, response }: HttpContextContract) {
    try {
      const helpRequest = await HelpRequest.findOrFail(params.id)

      const data = request.only([
        'longitude',
        'latitude',
        'address',
        'description',
        'source',
        'status',
        'name',
        'phone',
        'email',
        'isOnSite'
      ])

      helpRequest.merge(data)

      await helpRequest.save()

      return helpRequest
    } catch (error) {
      return response.badRequest({
        error: { message: 'Unable update the help request' }
      })
    }
  }

  public async destroy({ params, response }: HttpContextContract) {
    try {
      const helpRequest = await HelpRequest.findOrFail(params.id)

      await helpRequest.delete()
    } catch (error) {
      return response.badRequest({
        error: { message: 'Unable delete the help request' }
      })
    }
  }

  public async addType({ params, request, response }: HttpContextContract) {
    try {
      const helpRequest = await HelpRequest.findOrFail(params.id)

      const { typeId } = request.only(['typeId'])

      const typesQuery = helpRequest.related('types')
      await typesQuery.attach([typeId])

      return helpRequest.load('types')
    } catch (error) {
      return response.badRequest({
        error: { message: 'Unable to add the types to the help request' }
      })
    }
  }

  public async removeType({ params, request, response }: HttpContextContract) {
    try {
      const helpRequest = await HelpRequest.findOrFail(params.id)

      const { typeId } = request.only(['typeId'])

      const typesQuery = helpRequest.related('types')
      await typesQuery.detach([typeId])

      return helpRequest.load('types')
    } catch (error) {
      return response.badRequest({
        error: { message: 'Unable to remove the types from the help request' }
      })
    }
  }

  public async index({ response }: HttpContextContract) {
    try {
      const helpRequests = await HelpRequest.query()
        .preload('types')
        .orderBy('created_at', 'desc')

      return helpRequests
    } catch (error) {
      return response.noContent()
    }
  }

  public async show({ params, response }: HttpContextContract) {
    try {
      const helpRequest = await HelpRequest.find(params.id)

      return helpRequest
    } catch (error) {
      return response.noContent()
    }
  }

  public async indexByRecent({ response }: HttpContextContract) {
    try {
      const helpRequests = await HelpRequest.query().orderBy('created_at', 'desc')

      return helpRequests
    } catch (error) {
      return response.noContent()
    }
  }

  public async indexByOldest({ response }: HttpContextContract) {
    try {
      const helpRequests = await HelpRequest.query().orderBy('created_at', 'asc')

      return helpRequests
    } catch (error) {
      return response.noContent()
    }
  }

  public async assign({ params, request, response }: HttpContextContract) {
    try {
      Logger.info('Assigning volunteer: params=%o', params)
      const helpRequest = await HelpRequest.findOrFail(params.id)
      Logger.info('Found request: %o', helpRequest.id)
      
      const { volunteerId } = request.only(['volunteerId'])
      Logger.info('Volunteer ID: %s', volunteerId)

      helpRequest.assignedVolunteerId = volunteerId
      helpRequest.status = HelpRequestStatus.Assigned
      
      Logger.info('Saving...')
      await helpRequest.save()
      Logger.info('Saved.')

      return helpRequest
    } catch (error) {
      Logger.error('Assign error: %o', error)
      return response.badRequest({
        error: { 
          message: 'Unable to assign volunteer',
          details: error.message,
          code: error.code
        }
      })
    }
  }
  /*
  public async indexByTypes({ request, response }: HttpContextContract) {
    try {
      const { types } = request.get()

      // Fetch help requests by types
      const helpRequests = await HelpRequest.query()
        .whereHas('types', (builder) => {
          builder.whereIn('type', types.split(',')) // Assuming types are comma-separated
        })
        .fetch()

      return response.status(200).json({ data: helpRequests })
    } catch (error) {
      return response.noContent()
    }
  }
  */
}
