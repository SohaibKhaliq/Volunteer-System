import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ChatRoom from 'App/Models/ChatRoom'
import Team from 'App/Models/Team'
import Message from 'App/Models/Message'
import Organization from 'App/Models/Organization'
import { DateTime } from 'luxon'
import http from 'http'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ChatController {
  /**
   * Helper to send internal notification to socket server
   */
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
   * List all chat rooms for the current user
   */
  public async index({ auth, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()

    // Get orgs managed by user
    const managedOrgs = await Organization.query()
      .where('owner_id', user.id)
      .orWhereHas('volunteers', (q) => {
        q.where('user_id', user.id).whereIn('role', ['admin', 'coordinator'])
      })
      .select('id')

    const managedOrgIds = managedOrgs.map((o) => o.id)

    const rooms = await ChatRoom.query()
      .where('volunteer_id', user.id)
      .orWhereIn('organization_id', managedOrgIds)
      .preload('organization')
      .preload('volunteer')
      .preload('resource')
      .preload('messages', (builder) => {
        builder.orderBy('created_at', 'desc').limit(1)
      })
      .orderBy('updated_at', 'desc')

    return response.ok(rooms)
  }

  /**
   * Get messages for a specific room
   */
  public async show({ params, auth, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const roomId = params.id

    const room = await ChatRoom.find(roomId)
    if (!room) {
      return response.notFound('Chat room not found')
    }

    // Auth check: User must be the volunteer OR a manager of the org
    const isVolunteer = room.volunteerId === user.id

    let isManager = false
    if (!isVolunteer) {
      // query DB to check if user manages this org
      const org = await Organization.query()
        .where('id', room.organizationId)
        .where((q) => {
          q.where('owner_id', user.id).orWhereHas('volunteers', (sq) => {
            sq.where('user_id', user.id).whereIn('role', ['admin', 'coordinator'])
          })
        })
        .first()
      isManager = !!org
    }

    if (!isVolunteer && !isManager) {
      return response.forbidden('You do not have access to this chat')
    }

    // load messages
    // simple pagination could be added here
    await room.load('messages', (q) => q.orderBy('created_at', 'asc'))
    await room.load('organization')
    await room.load('volunteer')
    await room.load('resource')

    return response.ok(room)
  }

  /**
   * Send a message
   */
  public async store({ request, auth, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()

    // Validate request
    const { roomId, content, organizationId, volunteerId, resourceId, type, metadata } =
      request.all()

    let room: ChatRoom | null = null

    if (roomId) {
      room = await ChatRoom.find(roomId)
      if (!room) return response.notFound('Room not found')

      // Auth check
      const isVolunteer = room.volunteerId === user.id
      let isManager = false
      if (!isVolunteer) {
        const org = await Organization.query()
          .where('id', room.organizationId)
          .where((q) => {
            q.where('owner_id', user.id).orWhereHas('volunteers', (sq) => {
              sq.where('user_id', user.id).whereIn('role', ['admin', 'coordinator'])
            })
          })
          .first()
        isManager = !!org
      }

      if (!isVolunteer && !isManager && !user.isAdmin) {
        return response.forbidden('Access denied')
      }
    } else {
      // Creating a new room / finding existing context
      // Requires organizationId and volunteerId
      if (!organizationId || !volunteerId) {
        return response.badRequest('organizationId and volunteerId required to create chat')
      }

      // Check permission to create chat
      // Volunteer can start chat with org they belong to?
      // Org manager can start chat with volunteer.

      // Simplification: Check if chat exists
      room = await ChatRoom.query()
        .where('organization_id', organizationId)
        .where('volunteer_id', volunteerId)
        .where('resource_id', resourceId || null) // Optional resource context
        .first()

      if (!room) {
        // Create new
        room = await ChatRoom.create({
          organizationId,
          volunteerId,
          resourceId: resourceId || null
        })
      }
    }

    // Create message
    const message = await Message.create({
      roomId: room.id,
      senderId: user.id,
      content: content || '',
      type: type || 'text',
      metadata: metadata || null,
      readAt: null
    })

    // Update room timestamp
    room.updatedAt = DateTime.now()
    await room.save()

    // Broadcast to socket
    await this.notifySocket(room.id, message)

    return response.created(message)
  }

  /**
   * Start or get existing chat room without sending a message
   */
  public async start({ request, auth, response }: HttpContextContract) {
    const authUser = await auth.use('api').authenticate()
    const { organizationId, volunteerId, resourceId, teamId } = request.all()

    console.log('--- Chat Start Debug ---')
    console.log('Auth User ID:', authUser.id)
    console.log('Received Params:', { organizationId, volunteerId, resourceId, teamId })

    const vId = volunteerId ? Number(volunteerId) : authUser.id
    const tId = teamId ? Number(teamId) : null
    const rId = resourceId ? Number(resourceId) : null
    let effectiveOrgId = organizationId ? Number(organizationId) : null

    // If teamId provided, resolve organizationId if not present
    if (tId && !effectiveOrgId) {
      const team = await Team.find(tId)
      if (team) {
        effectiveOrgId = team.organizationId
        console.log('Resolved orgId from team:', effectiveOrgId)
      } else {
        console.log('Team not found for ID:', tId)
      }
    }

    if (!effectiveOrgId) {
      console.log('Error: missing effectiveOrgId')
      return response.badRequest({ message: 'organizationId (or valid teamId) required' })
    }

    // Since vId defaults to authUser.id, it will always be present if authenticated

    // Reuse logic or simplify: Just find or create the room
    // Determine if the DB schema has a `team_id` column
    const hasTeamColumnResult = await Database.rawQuery(
      "SHOW COLUMNS FROM chat_rooms LIKE 'team_id'"
    )
    const hasTeamColumn = Array.isArray(hasTeamColumnResult[0]) && hasTeamColumnResult[0].length > 0

    // Find existing
    const roomQuery = ChatRoom.query()
      .where('organization_id', effectiveOrgId)
      .where('volunteer_id', vId)

    if (rId) {
      roomQuery.where('resource_id', rId)
    } else {
      roomQuery.whereNull('resource_id')
    }

    if (hasTeamColumn) {
      if (tId) {
        roomQuery.where('team_id', tId)
      } else {
        roomQuery.whereNull('team_id')
      }
    }

    // Attempt to find; if DB doesn't have team_id this won't throw now because we only add team clause when supported
    let room = await roomQuery.first()

    if (room) {
      console.log('Found existing room:', room.id)
    } else {
      // Create new
      console.log('Creating new room...')
      const createPayload: any = {
        organizationId: effectiveOrgId,
        volunteerId: vId,
        resourceId: rId,
        type: tId ? 'team' : rId ? 'resource_related' : 'direct'
      }

      if (hasTeamColumn) {
        createPayload.teamId = tId
      }

      room = await ChatRoom.create(createPayload)
      console.log('Created room ID:', room.id)
    }

    return response.ok(room)
  }
}
