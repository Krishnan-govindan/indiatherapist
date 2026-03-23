# India Therapist — Claude Code Instructions

## Project Structure

- `api/` — Express.js backend (Railway deployment). TypeScript, compiled with `tsc`.
- `web/` — Next.js 15 frontend (Vercel deployment).

## Preview / Dev Server Rules

**Changes to `api/` do NOT require a preview server.**
- The API is a backend service deployed to Railway via `git push`.
- After editing files in `api/`, verify with `cd api && npm run build` (TypeScript compile check only).
- Do NOT call `preview_start` or follow the preview verification workflow for backend-only changes.
- The "Preview Required" stop hook does not apply to `api/` changes.

**Changes to `web/` DO require preview verification.**
- If editing frontend files in `web/`, use `preview_start` and follow the verification workflow.

## Build & Deploy

- Backend: `cd api && npm run build` to type-check. Railway auto-deploys on `git push origin master`.
- Frontend: `cd web && npm run build` to verify. Vercel auto-deploys on push.
