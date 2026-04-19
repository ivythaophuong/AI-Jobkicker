# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build (outputs to /dist)
npm run preview   # Preview production build locally
npm test          # Run Vitest tests (vitest run, no watch mode)
```

## Architecture

**CareerAiHub** is a React 18 SPA with no backend server. All AI calls go directly from the browser to Anthropic, OpenAI, and Gemini APIs. Supabase handles auth and persistence.

### Entry point & routing

`index.html` → `src/main.jsx` → `src/App.jsx`

There is no React Router. Navigation is tab-based: `App.jsx` manages an `activeModule` state that controls which of the 12 feature components renders. Adding a new module means adding it to the `MODULES` array in `App.jsx` and creating a component under `src/features/`.

### AI integration

All LLM calls go through `src/lib/ai.jsx`. The primary provider is Anthropic Claude (configured via `VITE_LLM_PROVIDER` and `VITE_ANTHROPIC_API_KEY`). OpenAI and Gemini are partially stubbed as fallbacks. If a secondary provider key is absent, the code degrades to `claude-3-haiku-20240307`.

Calls are direct HTTPS requests to `https://api.anthropic.com/v1/messages` — no proxy layer.

### Supabase

`src/lib/supabase.js` exports a custom `sb` client (not the official `createClient`). It wraps fetch manually with the anon key and user JWT. The schema has 9 tables: `user_memory`, `resume_scans`, `applications`, `star_stories`, `cover_letters`, `jd_analyses`, `mock_sessions`, `negotiation_practice`, `insights`. All rows are scoped by `user_id` via RLS.

`src/hooks/useMemory.js` fetches all 9 tables in parallel on login, normalizes snake_case → camelCase, and upserts a JSON blob backup to `user_memory`. It uses an atomic lock flag to prevent race conditions.

### Document parsing

`src/lib/resumeParser.js` extracts text client-side using `pdfjs-dist` (PDF) and `mammoth` (DOCX). The raw text is then passed to Claude for structuring.

### Styling

No Tailwind or external UI library. All styles are inline CSS-in-JS objects. Reusable primitives (`Card`, `Btn`, `Badge`, `Spinner`, `EmptyState`) live in `src/components/CommonUI.jsx`. The color palette and per-module color assignments are in `src/styles/theme.js`. Dark mode is the default; light mode is a toggle.

### Deployment

Docker multi-stage build: Node 20 builds the app, Nginx Alpine serves `/dist`. `docker-entrypoint.sh` injects environment variables into the minified bundle at container start via `sed` on placeholder strings (e.g. `__CLAUDE_KEY_PLACEHOLDER__`). Port 8081 internally, exposed via Nginx Proxy Manager. Production runs on a VPS with Let's Encrypt SSL.

## Environment variables

All env vars are prefixed `VITE_` (Vite exposes them to the browser bundle):

| Variable | Purpose |
|---|---|
| `VITE_LLM_PROVIDER` | Primary provider: `anthropic` |
| `VITE_LLM_MODEL` | Model ID (e.g. `claude-3-5-sonnet-20240620`) |
| `VITE_ANTHROPIC_API_KEY` | Anthropic API key |
| `VITE_OPENAI_API_KEY` | Optional OpenAI key (fallback) |
| `VITE_GEMINI_API_KEY` | Optional Gemini key (fallback) |

Copy `.env` and fill in keys before running locally.

## Testing

The only test file is `src/auth.test.js` — Vitest integration tests that hit real Supabase endpoints (not mocked). No component or unit tests exist.
