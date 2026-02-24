# UTDisaster Frontend

Frontend for the UTDisaster dashboard: interactive map, chat, and controls. Built with React, TypeScript, and Vite.

## Run locally

```bash
npm install   # includes Leaflet for the map
npm run dev
```

## Build

```bash
npm run build
```

## Environment (optional)

For live chat and API, set in `.env`:

- `VITE_API_BASE_URL` – API base URL (e.g. `https://api.example.com`). If set, chat WebSocket URL is derived as `{api}/chat/ws` unless overridden.
- `VITE_CHAT_WS_URL` – Override chat WebSocket URL (e.g. `wss://api.example.com/chat/ws`).
- `VITE_CHAT_MODE` – `mock` (default), `live`, or `auto` (try live, fallback to mock).

Leave unset to use mock chat only.

## Project structure

- `src/pages/` – Dashboard and top-level layout.
- `src/components/` – Reusable UI: `chat/` (panel, history, realtime), `controls/` (top bar), `dashboard/` (sidebar), `map/` (interactive map and polygons).
