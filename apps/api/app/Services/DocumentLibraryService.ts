import Document from 'App/Models/Document'
import DocumentAcknowledgment from 'App/Models/DocumentAcknowledgment'
import { DateTime } from 'luxon'

/**
 * Document Library Service
 * Manages organizational documents with read & acknowledge tracking
 */
export default class DocumentLibraryService {
  /**
   * Get documents requiring acknowledgment for a user
   */
  public static async getRequiredDocumentsForUser(
    userId: number,
    organizationId?: number
  ): Promise<Document[]> {
    const query = Document.query()
      .where('requires_acknowledgment', true)
      .where('status', 'published')
      .whereNull('expires_at')
      .orWhere('expires_at', '>', DateTime.now().toSQL())

    // Filter by organization or public documents
    if (organizationId) {
      query.where((q) => {
        q.where('organization_id', organizationId).orWhere('is_public', true)
      })
    } else {
      query.where('is_public', true)
    }

    const documents = await query

    // Filter out documents already acknowledged by this user
    const acknowledged = await DocumentAcknowledgment.query()
      .where('user_id', userId)
      .select('document_id')

    const acknowledgedIds = new Set(acknowledged.map((a) => a.documentId))

    return documents.filter((doc) => !acknowledgedIds.has(doc.id))
  }

  /**
   * Record document acknowledgment
   */
  public static async acknowledgeDocument(
    documentId: number,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
    notes?: string
  ): Promise<DocumentAcknowledgment> {
    // Check if already acknowledged
    const existing = await DocumentAcknowledgment.query()
      .where('document_id', documentId)
      .where('user_id', userId)
      .first()

    if (existing) {
      // Update existing acknowledgment
      existing.acknowledgedAt = DateTime.now()
      existing.ipAddress = ipAddress
      existing.userAgent = userAgent
      existing.notes = notes
      await existing.save()
      return existing
    }

    // Create new acknowledgment
    const acknowledgment = await DocumentAcknowledgment.create({
      documentId,
      userId,
      acknowledgedAt: DateTime.now(),
      ipAddress,
      userAgent,
      notes
    })

    return acknowledgment
  }

  /**
   * Get acknowledgment statistics for a document
   */
  public static async getAcknowledgmentStats(documentId: number): Promise<{
    totalRequired: number
    acknowledged: number
    pending: number
    percentageComplete: number
  }> {
    const document = await Document.find(documentId)
    if (!document) {
      return {
        totalRequired: 0,
        acknowledged: 0,
        pending: 0,
        percentageComplete: 0
      }
    }

    // Get total users who should acknowledge (organization members or all if public)
    // For simplicity, we'll just count acknowledgments
    const acknowledgments = await DocumentAcknowledgment.query().where('document_id', documentId)

    const acknowledged = acknowledgments.length

    // This is a simplified calculation
    // In production, you'd need to count organization members or all users
    const totalRequired = acknowledged + 10 // Placeholder

    return {
      totalRequired,
      acknowledged,
      pending: Math.max(0, totalRequired - acknowledged),
      percentageComplete:
        totalRequired > 0 ? Math.round((acknowledged / totalRequired) * 100) : 0
    }
  }

  /**
   * Check if a user has acknowledged a document
   */
  public static async hasUserAcknowledged(
    documentId: number,
    userId: number
  ): Promise<boolean> {
    const acknowledgment = await DocumentAcknowledgment.query()
      .where('document_id', documentId)
      .where('user_id', userId)
      .first()

    return !!acknowledgment
  }

  /**
   * Get all acknowledgments for a user
   */
  public static async getUserAcknowledgments(userId: number): Promise<DocumentAcknowledgment[]> {
    const acknowledgments = await DocumentAcknowledgment.query()
      .where('user_id', userId)
      .preload('document')
      .orderBy('acknowledged_at', 'desc')

    return acknowledgments
  }

  /**
   * Get documents by category
   */
  public static async getDocumentsByCategory(
    category: string,
    organizationId?: number
  ): Promise<Document[]> {
    const query = Document.query()
      .where('category', category)
      .where('status', 'published')

    if (organizationId) {
      query.where((q) => {
        q.where('organization_id', organizationId).orWhere('is_public', true)
      })
    } else {
      query.where('is_public', true)
    }

    return await query.orderBy('title', 'asc')
  }

  /**
   * Get recently published documents
   */
  public static async getRecentDocuments(
    limit: number = 10,
    organizationId?: number
  ): Promise<Document[]> {
    const query = Document.query().where('status', 'published').whereNotNull('published_at')

    if (organizationId) {
      query.where((q) => {
        q.where('organization_id', organizationId).orWhere('is_public', true)
      })
    } else {
      query.where('is_public', true)
    }

    return await query.orderBy('published_at', 'desc').limit(limit)
  }

  /**
   * Format document category for display
   */
  public static formatCategory(category: string): string {
    const categories: Record<string, string> = {
      policy: 'Policy Document',
      procedure: 'Procedure',
      training: 'Training Material',
      oh_s: 'OH&S Document',
      safety: 'Safety Guideline',
      legal: 'Legal Document',
      other: 'Other'
    }
    return categories[category] || category
  }

  /**
   * Format file size for display
   */
  public static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  /**
   * Check if document is expired
   */
  public static isDocumentExpired(document: Document): boolean {
    if (!document.expiresAt) return false
    return DateTime.now() > document.expiresAt
  }

  /**
   * Get pending acknowledgments for an organization
   */
  public static async getPendingAcknowledgments(organizationId: number): Promise<{
    document: Document
    pendingCount: number
  }[]> {
    const documents = await Document.query()
      .where('organization_id', organizationId)
      .where('requires_acknowledgment', true)
      .where('status', 'published')

    const results: Array<{ document: Document; pendingCount: number }> = []

    for (const document of documents) {
      const stats = await this.getAcknowledgmentStats(document.id)
      if (stats.pending > 0) {
        results.push({
          document,
          pendingCount: stats.pending
        })
      }
    }

    return results.sort((a, b) => b.pendingCount - a.pendingCount)
  }
}
