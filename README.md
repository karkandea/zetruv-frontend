# Zetruv Frontend

ReactJS frontend implementation based on the Zetruv Figma redesign.

## Stack

- ReactJS
- Vite
- Plain CSS (no Tailwind)
- Native `fetch` for backend integration

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

## Backend integration

Backend is intentionally separated from this repository. Configure:

```env
VITE_API_BASE_URL=https://your-backend.example.com/v1
```

The frontend currently expects these contracts:

- `GET /homepage` → homepage content such as registered user count, flash-sale items, countdown, and trending games.
- `POST /support/reports` → `{ name, phone, description }`.

Until `VITE_API_BASE_URL` is configured, the app automatically uses `src/data/mockData.js` so frontend development can continue independently from the backend team.

## Structure

```text
src/
  api/          # HTTP client / backend boundary
  components/   # Reusable UI components
  data/         # Temporary mock data and Figma asset references
  pages/        # Page composition
  services/     # Endpoint-specific services
  styles/       # Global design styles and responsive rules
```

## Figma asset note

The first pass references exact Figma MCP exports so the UI can be matched quickly. Those URLs are short-lived. Before production handoff, export the same assets into `public/assets/` and update `src/data/assets.js` to local paths.

## Current scope

- Sticky two-level navbar
- Hero / welcome section
- Flash Sale
- Game Trending + category interaction
- Responsive desktop/tablet/mobile behavior
- Footer
- Floating support form based on the Figma chatbot frame
- Backend-ready service layer with mock fallback
