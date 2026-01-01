import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Document from 'App/Models/Document'
import DocumentLibraryService from 'App/Services/DocumentLibraryService'
import { DateTime } from 'luxon'
import Drive from '@ioc:Adonis/Core/Drive'
import Logger from '@ioc:Adonis/Core/Logger'

export default class DocumentsController {
  /**
   * List all documents
   */
  public async index({ request, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const { category, organizationId, requiresAck } = request.qs()

      let query = Document.query().where('status', 'published')

      if (category) {
        query = query.where('category', category)
      }

      if (organizationId) {
        query = query.where((q) => {
          q.where('organization_id', organizationId).orWhere('is_public', true)
        })
      } else {
        query = query.where('is_public', true)
      }

      if (requiresAck === 'true') {
        query = query.where('requires_acknowledgment', true)
      }

      const documents = await query.orderBy('title', 'asc')

      // Check acknowledgment status for each document
      const docsWithStatus = await Promise.all(
        documents.map(async (doc) => {
          const acknowledged = await DocumentLibraryService.hasUserAcknowledged(doc.id, user.id)
          return {
            ...doc.toJSON(),
            acknowledged,
            isExpired: DocumentLibraryService.isDocumentExpired(doc)
          }
        })
      )

      return response.ok(docsWithStatus)
    } catch (error) {
      Logger.error('Failed to list documents:', error)
      return response.status(500).send({ message: 'Failed to list documents' })
    }
  }

  /**
   * Get documents requiring acknowledgment for current user
   */
  public async required({ response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      // Get user's organization (simplified - assumes one org)
      const organizationId = undefined // Would fetch from user's org membership

      const documents = await DocumentLibraryService.getRequiredDocumentsForUser(
        user.id,
        organizationId
      )

      return response.ok(documents)
    } catch (error) {
      Logger.error('Failed to get required documents:', error)
      return response.status(500).send({ message: 'Failed to get required documents' })
    }
  }

  /**
   * Get a specific document
   */
  public async show({ params, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const document = await Document.find(params.id)
      if (!document) {
        return response.notFound({ message: 'Document not found' })
      }

      // Check if user has acknowledged
      const acknowledged = await DocumentLibraryService.hasUserAcknowledged(document.id, user.id)

      // Get acknowledgment stats
      const stats = await DocumentLibraryService.getAcknowledgmentStats(document.id)

      return response.ok({
        ...document.toJSON(),
        acknowledged,
        stats,
        isExpired: DocumentLibraryService.isDocumentExpired(document)
      })
    } catch (error) {
      Logger.error('Failed to get document:', error)
      return response.status(500).send({ message: 'Failed to get document' })
    }
  }

  /**
   * Create a new document
   */
  public async store({ request, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()

      const file = request.file('file', {
        size: '50mb',
        extnames: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png']
      })

      if (!file) {
        return response.badRequest({ message: 'File is required' })
      }

      const { title, description, category, organizationId, requiresAcknowledgment, isPublic } =
        request.only([
          'title',
          'description',
          'category',
          'organizationId',
          'requiresAcknowledgment',
          'isPublic'
        ])

      // Move file to private storage
      await file.moveToDisk('local', {
        dirname: 'documents',
        visibility: 'private'
      } as any)

      const document = await Document.create({
        title,
        description,
        category: category || 'other',
        filePath: `documents/${file.fileName}`,
        fileName: file.clientName || '',
        fileType: file.type || '',
        fileSize: file.size || 0,
        organizationId: organizationId ? Number(organizationId) : undefined,
        requiresAcknowledgment:
          requiresAcknowledgment === 'true' || requiresAcknowledgment === true,
        isPublic: isPublic === 'true' || isPublic === true,
        version: 1,
        status: 'published',
        publishedAt: DateTime.now()
      })

      return response.created(document)
    } catch (error) {
      Logger.error('Failed to create document:', error)
      return response.status(500).send({
        message: 'Failed to create document',
        error: error.message
      })
    }
  }

  /**
   * Acknowledge a document
   */
  public async acknowledge({ params, request, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const documentId = params.id
      const { notes } = request.only(['notes'])

      const document = await Document.find(documentId)
      if (!document) {
        return response.notFound({ message: 'Document not found' })
      }

      // Get IP and User Agent for audit trail
      const ipAddress = request.ip()
      const userAgent = request.header('user-agent')

      const acknowledgment = await DocumentLibraryService.acknowledgeDocument(
        Number(documentId),
        user.id,
        ipAddress,
        userAgent,
        notes
      )

      return response.ok({
        message: 'Document acknowledged successfully',
        acknowledgment
      })
    } catch (error) {
      Logger.error('Failed to acknowledge document:', error)
      return response.status(500).send({
        message: 'Failed to acknowledge document',
        error: error.message
      })
    }
  }

  /**
   * Download a document file
   */
  public async download({ params, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()

      const document = await Document.find(params.id)
      if (!document) {
        return response.notFound({ message: 'Document not found' })
      }

      // Check if file exists
      const exists = await Drive.exists(document.filePath)
      if (!exists) {
        return response.notFound({ message: 'File not found' })
      }

      // Stream the file
      const fileContent = await Drive.get(document.filePath)

      response.header('Content-Type', document.fileType)
      response.header('Content-Disposition', `attachment; filename="${document.fileName}"`)

      return response.send(fileContent)
    } catch (error) {
      Logger.error('Failed to download document:', error)
      return response.status(500).send({ message: 'Failed to download document' })
    }
  }

  /**
   * Get user's acknowledgment history
   */
  public async myAcknowledgments({ response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const acknowledgments = await DocumentLibraryService.getUserAcknowledgments(user.id)

      return response.ok(acknowledgments)
    } catch (error) {
      Logger.error('Failed to get acknowledgments:', error)
      return response.status(500).send({ message: 'Failed to get acknowledgments' })
    }
  }

  /**
   * Update a document
   */
  public async update({ params, request, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()

      const document = await Document.find(params.id)
      if (!document) {
        return response.notFound({ message: 'Document not found' })
      }

      const updates = request.only([
        'title',
        'description',
        'category',
        'requiresAcknowledgment',
        'isPublic',
        'status'
      ])

      document.merge(updates)
      await document.save()

      return response.ok(document)
    } catch (error) {
      Logger.error('Failed to update document:', error)
      return response.status(500).send({ message: 'Failed to update document' })
    }
  }

  /**
   * Delete a document
   */
  public async destroy({ params, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()

      const document = await Document.find(params.id)
      if (!document) {
        return response.notFound({ message: 'Document not found' })
      }

      // Delete file from storage
      const exists = await Drive.exists(document.filePath)
      if (exists) {
        await Drive.delete(document.filePath)
      }

      await document.delete()

      return response.noContent()
    } catch (error) {
      Logger.error('Failed to delete document:', error)
      return response.status(500).send({ message: 'Failed to delete document' })
    }
  }
}
