import Ws from 'App/Services/Ws'
import Database from '@ioc:Adonis/Lucid/Database'
import crypto from 'crypto'

Ws.boot()

/**
 * Listen for incoming socket connections
 */
Ws.io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    if (!token || typeof token !== 'string') {
      return next(new Error('Missing token'))
    }

    let userId: any = null

    // Case 1: AdonisJS 5 OAT format "ID.SECRET"
    if (token.includes('.')) {
      const parts = token.split('.')
      if (parts.length === 2) {
        const [idPart, secret] = parts
        const idBase64 = idPart.startsWith('oat_') ? idPart.substring(4) : idPart
        try {
          const id = Buffer.from(idBase64, 'base64').toString('utf-8')
          const hashedSecret = crypto.createHash('sha256').update(secret).digest('hex')
          const rows = await Database.from('api_tokens')
            .where('id', id)
            .andWhere('token', hashedSecret)
            .select('user_id')
            .limit(1)

          if (rows.length > 0) userId = rows[0].user_id
        } catch (e) {}
      }
    }

    // Case 2: Simple hash
    if (!userId) {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
      const rows = await Database.from('api_tokens')
        .where('token', hashedToken)
        .select('user_id')
        .limit(1)

      if (rows.length > 0) userId = rows[0].user_id
    }

    if (!userId) {
      return next(new Error('Invalid token'))
    }

    socket.data.userId = userId

    // find whether user is admin
    const user = await Database.from('users').where('id', userId).select('is_admin').first()
    socket.data.isAdmin = !!user?.is_admin

    return next()
  } catch (err) {
    return next(new Error('Auth failure'))
  }
})

Ws.io.on('connection', (socket) => {
  const uid = socket.data.userId
  if (!uid) return

  // join user room
  socket.join(`user:${uid}`)
  if (socket.data.isAdmin) socket.join('admin')

  socket.on('join-chat', (roomId) => {
    socket.join(`chat:${roomId}`)
  })

  socket.on('typing', (roomId) => {
    socket.to(`chat:${roomId}`).emit('typing', { roomId, userId: uid })
  })

  socket.on('stop-typing', (roomId) => {
    socket.to(`chat:${roomId}`).emit('stop-typing', { roomId, userId: uid })
  })
})
