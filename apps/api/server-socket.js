#!/usr/bin/env node
/*
  Lightweight socket.io server that accepts internal POSTs from the API
  and emits realtime notifications to connected clients. Auth is performed
  for clients using the api_tokens table in the configured MySQL database.

  Run with: node server-socket.js
  Configure via environment variables (same DB settings used by the API):
    DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE
    SOCKET_PORT (optional, default 4001)
    SOCKET_INTERNAL_SECRET (optional — used to validate internal API POSTs)
*/

const http = require('http')
const { Server } = require('socket.io')
let express = null
try {
  // express is optional for the socket server; fallback to builtin http parser
  // so `pnpm dev` doesn't fail if deps weren't installed yet.
  express = require('express')
} catch (e) {
  // not installed — we'll fall back to native http request handling below
  // keep a friendly console message so devs know
  // eslint-disable-next-line no-console
  console.warn('express not found — falling back to built-in http handler for internal POSTs')
}
const mysql = require('mysql2/promise')

const PORT = process.env.SOCKET_PORT ? Number(process.env.SOCKET_PORT) : 4001

const server = http.createServer()
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
})

async function initDb() {
  const conn = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'adonis'
  })
  return conn
}

async function main() {
  // create express app when available; otherwise we'll mount a lightweight
  // native http JSON handler below so internal POSTs work even without express
  const app = express ? express() : null
  if (app && express) app.use(express.json())

  // internal endpoint used by the API (Notification model) to notify this socket server
  const INTERNAL_SECRET = process.env.SOCKET_INTERNAL_SECRET || ''

  // Express path when available
  if (app) {
    app.post('/_internal/notify', (req, res) => {
      try {
        if (INTERNAL_SECRET && req.headers['x-internal-secret'] !== INTERNAL_SECRET) {
          return res.status(403).json({ error: 'forbidden' })
        }
        const data = req.body
        if (!data) return res.status(400).json({ error: 'invalid payload' })

        // emit to user room
        if (data.userId) io.to(`user:${data.userId}`).emit('notification', data)
        // emit to admins
        io.to('admin').emit('notification', data)

        return res.status(200).json({ ok: true })
      } catch (e) {
        console.warn('internal notify failed', e)
        return res.status(500).json({ error: 'internal' })
      }
    })
  }

  const db = await initDb()

  // Authentication middleware: expect handshake.auth.token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token
      if (!token) return next(new Error('Missing token'))

      const [rows] = await db.execute('SELECT user_id FROM api_tokens WHERE token = ?', [token])
      if (!rows || rows.length === 0) return next(new Error('Invalid token'))
      const userId = rows[0].user_id
      socket.data.userId = userId

      // find whether user is admin
      const [users] = await db.execute('SELECT is_admin FROM users WHERE id = ?', [userId])
      socket.data.isAdmin = !!(users && users[0] && users[0].is_admin)

      return next()
    } catch (err) {
      return next(new Error('Auth failure'))
    }
  })

  io.on('connection', (socket) => {
    const uid = socket.data.userId
    if (!uid) return
    console.log('Socket connected user', uid)

    // join user room
    socket.join(`user:${uid}`)
    if (socket.data.isAdmin) socket.join('admin')

    socket.on('disconnect', () => {
      // nothing to do here
      console.log('Socket disconnected', uid)
    })
  })

  // Mount the app on a http server.
  // If express isn't available we mount a tiny native handler that supports
  // POST /_internal/notify with JSON body parsing. This keeps the dev flow
  // working even if dependencies aren't installed yet.
  const serverWithApp = http.createServer((req, res) => {
    if (app) {
      // express will handle when available
      app(req, res)
      return
    }

    // Fallback: only support POST /_internal/notify
    if (req.method !== 'POST' || req.url !== '/_internal/notify') {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'not found' }))
      return
    }

    const secret = req.headers['x-internal-secret'] || ''
    if (INTERNAL_SECRET && secret !== INTERNAL_SECRET) {
      res.writeHead(403, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'forbidden' }))
      return
    }

    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      // guard against large bodies
      if (raw.length > 1024 * 1024) {
        // ~1MB limit
        req.destroy()
      }
    })

    req.on('end', () => {
      try {
        const data = raw ? JSON.parse(raw) : null
        if (!data) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'invalid payload' }))
          return
        }

        if (data.userId) io.to(`user:${data.userId}`).emit('notification', data)
        io.to('admin').emit('notification', data)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (err) {
        console.warn('internal notify error (fallback)', err)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'internal' }))
      }
    })
    req.on('error', (err) => {
      console.warn('request error', err)
      res.writeHead(500)
      res.end()
    })
  })
  // attach socket.io to serverWithApp
  io.attach(serverWithApp)

  serverWithApp.listen(PORT, () => console.log(`Socket server listening on ${PORT}`))
}

main().catch((err) => {
  console.error('Socket server failed to start', err)
  process.exit(1)
})
