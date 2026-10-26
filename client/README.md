# AI Guruji client

React/Vite frontend for the Express backend. Use Node 24. Run commands from this directory.

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and configure `VITE_API_URL` (including `/api`) and the Firebase web app values.
3. Configure MongoDB, Firebase Admin, `GEMINI_API_KEY`, and optional `GEMINI_MODEL` in `../backend/.env`, using the backend `.env.example`. Start that package with `npm run dev`.
4. Run this client with `npm run dev`.

The Google key belongs only on the backend. Browser `VITE_*` values are public build output. See the [project setup](../README.md) and [architecture reference](../docs/ARCHITECTURE.md) for deployment and API contracts.

Verification: `npm test` and `npm run build`.
