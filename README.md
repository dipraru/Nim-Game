# NIM Game (MERN)

This workspace contains a prototype MERN application for playing the two-player NIM game in real-time using Socket.IO.

Folders:
- `backend` — Express + Socket.IO server (in-memory game rooms)
- `frontend` — Vite + React client

See each folder's README for run instructions.

Deploying to Vercel
-------------------

This repository is prepared to deploy the static frontend to Vercel and includes a simple serverless health endpoint at `/api/health`.

Key points:
- The frontend (Vite) is built from the `frontend/` folder. Vercel will run `npm run build` in `frontend` and publish the output.
- A minimal serverless endpoint is available at `/api/health` (see `api/health.js`).
- The current backend (`backend/index.js`) runs an Express + Socket.IO server which requires a long-lived WebSocket server. Vercel's serverless functions are not suitable for hosting a Socket.IO server (they do not support long-lived WebSocket servers reliably).

Recommended options for real-time backend:
1. Deploy the existing Express + Socket.IO server to a platform that supports long-lived sockets (Render, Fly.io, a VPS, Railway). Then point the frontend to that server's URL.
2. Replace socket-based realtime with a serverless-friendly realtime product (Pusher, Supabase Realtime, Ably) and update frontend to use that client.

How to deploy the frontend to Vercel (brief):
1. Sign in to Vercel and import the repository.
2. In the project settings, set the Root Directory to the repository root. The included `vercel.json` routes static files from `frontend` and provides `/api` endpoints.
3. Ensure the Build Command is `npm run build --prefix frontend` and the Output Directory is `frontend/dist` if Vercel asks.

If you want, I can:
- Add an example of switching the frontend to use an externally hosted Socket.IO server.
- Help create a small deployable backend on Render or Railway and wire it to the frontend.

Quick local build example
-------------------------

To build the frontend locally (what Vercel will run under the hood):

```powershell
npm --prefix frontend install
npm --prefix frontend run build
```

What I changed
--------------
- Added `vercel.json` to configure Vercel's builds and routes.
- Added `api/health.js` as a tiny serverless health endpoint.
- Documented Socket.IO hosting recommendations.


