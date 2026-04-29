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

- `VITE_API_BASE_URL` – API base URL for live chat history and message sending (for example, `GET /chat/conversations`, `GET /chat/conversations/{id}`, and `POST /chat/message`). Leave unset to use mock chat history and mock replies.

## Project structure

- `src/pages/` – Dashboard and top-level layout.
- `src/components/` – Reusable UI: `chat/` (panel, history, realtime), `controls/` (top bar), `dashboard/` (sidebar), `map/` (interactive map and polygons).
