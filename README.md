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

- `VITE_API_BASE_URL` – API base URL for optional REST history (e.g. GET /chat/conversations, GET /chat/:id). Leave unset to use mock chat history. Chat sending is mock-only until the backend defines a real-time API.

## Project structure

- `src/pages/` – Dashboard and top-level layout.
- `src/components/` – Reusable UI: `chat/` (panel, history, realtime), `controls/` (top bar), `dashboard/` (sidebar), `map/` (interactive map and polygons).
