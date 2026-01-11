import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ResourceService from 'App/Services/ResourceService'
import AuditLog from 'App/Models/AuditLog'
import { DateTime } from 'luxon'
import ChatRoom from 'App/Models/ChatRoom'
import Message from 'App/Models/Message'
import http from 'http'

export default class ResourceAllocationController {
  private service = new ResourceService()

  private async notifySocket(roomId: number, message: Message) {
    try {
      const payload = JSON.stringify({
        roomId,
        message: message.toJSON()
      })
      
      const req = http.request({
        hostname: 'localhost',
        port: 4001,
        path: '/_internal/notify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length,
          'x-internal-secret': process.env.SOCKET_INTERNAL_SECRET || ''
        }
      })
      
      req.on('error', (e) => {
        console.error(`Socket notification failed: ${e.message}`)
      })
      
      req.write(payload)
      req.end()
    } catch (err) {
      console.error('Socket notify error', err)
    }
  }

  /**
   * Admin provisions/allocates resources to an organization
   */
  public async provision({ request, auth, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    
    // Authorization check - only admins can provision
    if (!user.isAdmin) {
      return response.forbidden('Only admins can provision resources')
    }

    const { resourceIds, orgId } = request.only(['resourceIds', 'orgId'])
    
    await this.service.allocateToOrg(resourceIds, orgId, user)

    return response.ok({ message: 'Resources allocated successfully' })
  }

  /**
   * Organization distributes resource to a volunteer
   */
  public async distribute({ request, auth, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    
    // In a real app, check if user is a coordinator for the org
    // For now, we assume if they can hit this endpoint with an orgId, they assume the role
    // Ideally we check `user.organizations` includes request.orgId with role 'coordinator'

    const { resourceId, volunteerId, notes, expectedReturnAt } = request.only([
      'resourceId', 
      'volunteerId', 
      'notes', 
      'expectedReturnAt'
    ])

    const date = expectedReturnAt ? DateTime.fromISO(expectedReturnAt) : undefined

    const assignment = await this.service.assignToVolunteer(
      resourceId, 
      volunteerId, 
      user, 
      notes, 
      date
    )

    // Auto-create chat and send welcome message
    try {
       // We assume assignment has organizationId loaded or we can infer it
       // Since the user distributing is from the org, we use the orgId from request context or user
       // Ideally assignment.organizationId
       const orgId = (assignment as any).organizationId || (user.related('organizations').query().first().then(o => o?.id))
       
       if (orgId) {
           const room = await ChatRoom.firstOrCreate({
             organizationId: typeof orgId === 'object' ? await orgId : orgId,
             volunteerId: volunteerId,
             resourceId: resourceId
           }, {
             organizationId: typeof orgId === 'object' ? await orgId : orgId,
             volunteerId: volunteerId,
             resourceId: resourceId
           })

           const msg = await Message.create({
             roomId: room.id,
             senderId: user.id,
             content: `Resource has been assigned to you. You can now coordinate here.`,
             type: 'system',
             metadata: { assignmentId: assignment.id },
             readAt: null
           })
           
           await this.notifySocket(room.id, msg)
       }
    } catch (e) {
      console.error('Failed to auto-initiate chat', e)
    }

    return response.ok({ message: 'Resource distributed', data: assignment })
  }

  /**
   * Volunteer requests to return an item
   */
  public async requestReturn({ request, auth, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const { assignmentId } = request.only(['assignmentId'])

    const assignment = await this.service.requestReturn(assignmentId, user)

    // Send return request in chat
    try {
        const room = await ChatRoom.query()
            .where('resource_id', (assignment as any).resourceId)
            .where('volunteer_id', user.id)
            .first()
        
        if (room) {
             const msg = await Message.create({
                roomId: room.id,
                senderId: user.id, 
                content: `I would like to return this resource.`,
                type: 'return_request',
                metadata: { assignmentId: assignment.id },
                readAt: null
             })
             await this.notifySocket(room.id, msg)
        }
    } catch (e) {
        console.error('Failed to notify chat for return', e)
    }

    return response.ok({ message: 'Return requested', data: assignment })
  }

  /**
   * Organization reconciles/confirms a return
   */
  public async reconcile({ request, auth, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    
    const { assignmentId, condition, notes } = request.only(['assignmentId', 'condition', 'notes'])

    const assignment = await this.service.confirmReturn(assignmentId, user, condition, notes)

    return response.ok({ message: 'Return confirmed', data: assignment })
  }

  /**
   * View chain of custody (history) for a resource
   */
  public async history({ params, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    
    // Potentially check if user belongs to the org that owns the resource
    // or is an admin.

    const logs = await AuditLog.query()
      .where('entity_type', 'resource')
      .where('target_id', params.id)
      .where('action', 'custody_chain')
      .preload('user')
      .orderBy('created_at', 'desc')

    return response.ok({ data: logs })
  }
}
