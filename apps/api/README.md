## Socket server (socket.io)

This project includes a small socket server script (server-socket.js) used to provide realtime notification delivery via socket.io.

Quick start (development):

1. Ensure environment variables are set so the socket server can connect to your DB and accept internal notifications from the API:

   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE
   SOCKET_PORT (optional, default 4001)
   SOCKET_INTERNAL_SECRET (optional — used to secure API → socket server internal posts)

2. Start the socket server from the api folder:

   node server-socket.js

The socket server listens on the port defined by SOCKET_PORT (default: 4001) and expects clients to pass their token via the socket.io auth handshake: io(url, { auth: { token } }). The server validates api tokens against the api_tokens table and joins sockets to per-user rooms (user:{id}) and an admin room.

Notifications are delivered from the API via an internal HTTP hook — the API POSTs JSON to `/_internal/notify` on the socket server. The socket server emits the payload to the target user's room (user:{id}) and the admin room. The API uses `SOCKET_INTERNAL_URL` to override the internal POST URL and sends `x-internal-secret` header with the value of `SOCKET_INTERNAL_SECRET`.

In production you should run the socket server as a managed process (pm2, systemd) or attach it into your main HTTP server for a single process. Consider securing the socket server (WSS, short-lived tokens) and avoid exposing the internal endpoint publicly.
