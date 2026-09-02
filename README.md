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

The live Zetruv deployment uses the backend through the same origin:

```text
https://zetruv.dualangka.com/api/v1
```

Production builds automatically default to `/api/v1`, so `VITE_API_BASE_URL` is optional for the normal VPS deployment. Set it only when the frontend must target a different backend origin.

During local `vite dev`, leaving `VITE_API_BASE_URL` empty keeps the existing mock-data workflow for frontend-only development. Production does not silently fall back to mock data when the API fails.

The homepage service adapts the backend `GET /homepage` contract into the current UI view model, including service categories, popular games, recent purchases, flash sale, joki products, merchandise, and the first CMS hero image.

`POST /support/reports` is still expected by the floating support form but is not part of the current backend feature set yet; production requests will fail instead of reporting a fake mock success.

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
- Production homepage backed by same-origin `/api/v1`
- Mock fallback limited to local development
