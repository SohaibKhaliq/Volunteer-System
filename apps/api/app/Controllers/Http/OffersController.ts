import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import Type from 'App/Models/Type'
import { OfferStatus } from 'Contracts/status'
import { createHelpOfferSchema } from 'shared'
import Offer from '../../Models/Offer'

export default class OffersController {
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
        'files'
      ])

      const parsedPayload = createHelpOfferSchema.parse({
        ...payload,
        types: JSON.parse(payload.types),
        location: JSON.parse(payload.location)
      })

      // Handle uploaded files safely: validate size/extensions and move to configured disk
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
        // Move to disk 'local' under offers directory so other services can find it
        await f.moveToDisk('offers')
        placedFiles.push({
          originalName: f.clientName || '',
          storedName: f.fileName || '',
          path: `offers/${f.fileName}`
        })
      }

      const helpRequest = await Offer.create({
        longitude: parsedPayload.location.lng,
        latitude: parsedPayload.location.lat,
        address: parsedPayload.location.address,
        description: parsedPayload.description,
        status: OfferStatus.planned,
        approvalStatus: 'pending',
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
      Logger.error('Failed to create help offer: %s', error.message)
      console.error(error)
      return response.badRequest({
        message: 'Failed to create help offer',
        error: error.messages
      })
    }
  }
  public async update({ request, params, response }: HttpContextContract) {
    try {
      const offer = await Offer.findOrFail(params.id)

      const data = request.only([
        'longitude',
        'latitude',
        'address',
        'description',
        'status',
        'name',
        'phone',
        'email',
        'isOnSite'
      ])

      offer.merge(data)

      await offer.save()

      return offer
    } catch (error) {
      return response.badRequest({
        error: { message: 'Unable update the offer' }
      })
    }
  }

  public async destroy({ params, response }: HttpContextContract) {
    try {
      const offer = await Offer.findOrFail(params.id)

      await offer.delete()
    } catch (error) {
      return response.badRequest({
        error: { message: 'Unable delete the offer' }
      })
    }
  }

  public async addType({ params, request, response }: HttpContextContract) {
    try {
      const offer = await Offer.findOrFail(params.id)

      const { typeId } = request.only(['typeId'])

      const typesQuery = offer.related('types')
      await typesQuery.attach([typeId])

      return offer.load('types')
    } catch (error) {
      return response.badRequest({
        error: { message: 'Unable to add the types to the offer' }
      })
    }
  }

  public async removeType({ params, request, response }: HttpContextContract) {
    try {
      const offer = await Offer.findOrFail(params.id)

      const { typeId } = request.only(['typeId'])

      const typesQuery = offer.related('types')
      await typesQuery.detach([typeId])

      return offer.load('types')
    } catch (error) {
      return response.badRequest({
        error: { message: 'Unable to remove the types from the offer' }
      })
    }
  }

  public async index({ request, response }: HttpContextContract) {
    try {
      const isAdmin = request.auth && request.auth.user && request.auth.user.isAdmin
      const query = Offer.query().orderBy('created_at', 'desc')
      if (!isAdmin) {
        query.where('approval_status', 'approved')
      }
      const offers = await query

      return offers
    } catch (error) {
      return response.noContent()
    }
  }

  public async show({ params, response }: HttpContextContract) {
    try {
      const offer = await Offer.find(params.id)

      return offer
    } catch (error) {
      return response.noContent()
    }
  }

  public async indexByRecent({ response }: HttpContextContract) {
    try {
      const offers = await Offer.query().orderBy('created_at', 'desc')

      return offers
    } catch (error) {
      return response.noContent()
    }
  }

  public async indexByOldest({ response }: HttpContextContract) {
    try {
      const offers = await Offer.query().orderBy('created_at', 'asc')

      return offers
    } catch (error) {
      return response.noContent()
    }
  }
  /*
      public async indexByTypes({ request, response }: HttpContextContract) {
        try {
          const { types } = request.get()
    
          // Fetch offers by types
          const offers = await Offer.query()
            .whereHas('types', (builder) => {
              builder.whereIn('type', types.split(',')) // Assuming types are comma-separated
            })
            .fetch()
    
          return response.status(200).json({ data: offers })
        } catch (error) {
          return response.noContent()
        }
      }
      */
}
