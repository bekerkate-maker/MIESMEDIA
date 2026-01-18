# Copilot Instructions for MIES_MEDIA

## Project Overview
- **MIES_MEDIA** is a React + TypeScript web app for managing model shoots, registrations, and client documents, using Supabase as the backend (auth, database, storage).
- The app is structured around pages for dashboard, shoot management, model/employee registration, and login. All business logic is in `src/`.
- Supabase functions (Deno) are used for backend tasks like sending registration emails.

## Key Architecture & Patterns
- **Routing:** Uses `react-router-dom` for navigation. Main routes are defined in `src/App.tsx`.
- **Auth:** Supabase auth is required for most routes. See `ProtectedRoute` in `App.tsx` for session logic.
- **Supabase Integration:** All DB/API calls use the singleton client from `src/integrations/supabase/client.ts`. Env vars are required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Data Models:** Types for models, employees, and shoots are defined inline in components or in `src/database/sqlite.ts` (used for local mock DB).
- **UI Components:** Shared UI (logo, PDF viewer, buttons, etc.) is in `src/components/` and `src/components/ui/`.
- **Assets:** Client logos and branding are in `src/components/logo_klanten/` and `src/assets/`.
- **PDF Handling:** Uses `react-pdf` and a custom `PDFViewer` for contract/terms display.
- **State:** Uses React hooks (`useState`, `useEffect`) for all state management.
- **Styling:** Global styles in `src/styles.css`. Inline styles are used for some components.
- **Aliases:** Use `@/` for `src/` imports (see `vite.config.ts` and `tsconfig.json`).

## Developer Workflows
- **Start Dev Server:** `npm run dev` (Vite, port 5173)
- **Build:** `npm run build`
- **Preview:** `npm run preview`
- **Supabase Functions:** Deno scripts in `supabase/functions/` (deployed via Supabase CLI, not Node)
- **Testing:** No formal test suite; test files like `test_add_note.js` are for manual/utility testing.
- **Environment:** Requires `.env` with Supabase keys for local dev.

## Conventions & Gotchas
- **Dutch/English Mix:** Code, comments, and UI are partly in Dutch.
- **Database:** Most data is in Supabase Postgres; some localStorage mocks exist for dev/testing.
- **No Redux/MobX:** Only React state/hooks.
- **No CSS-in-JS:** Use plain CSS or inline styles.
- **PDF Worker:** `public/pdf.worker.js` is required for PDF viewing.
- **Email Sending:** Uses Resend API via Supabase Edge Function (`send-shoot-registration-email.ts`).
- **Client Logos:** Add new logos to `src/components/logo_klanten/` and import explicitly.

## Key Files & Directories
- `src/App.tsx` — Main app, routing, auth
- `src/DashboardReal.tsx` — Main dashboard logic
- `src/pages/` — Page components (RegisterModel, ManageShoots, etc.)
- `src/integrations/supabase/client.ts` — Supabase client setup
- `supabase/functions/` — Edge functions (Deno)
- `src/components/` — Shared UI
- `src/database/sqlite.ts` — Local mock DB (dev only)

## Example: Adding a New Page
1. Create a new file in `src/pages/`.
2. Add a route in `src/App.tsx`.
3. Use Supabase client for data access.
4. Use `@/components/ui/` for UI primitives.

---

For questions about project-specific patterns, check the dashboard or registration pages for examples. When in doubt, follow the structure and conventions of existing files.