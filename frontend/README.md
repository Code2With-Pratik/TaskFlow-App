# TaskFlow frontend

TaskFlow is a responsive project and task workspace built with Next.js 16,
React 19, TypeScript, Tailwind CSS, and TanStack Query.

## Run locally

1. Start PostgreSQL and the API using the steps in [the backend README](../backend/README.md).
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the backend URL.
3. Install dependencies and start the frontend:

   ```powershell
   npm install
   npm run dev -- --port 3001
   ```

Open [http://localhost:3001](http://localhost:3001). The root page redirects to
the protected dashboard. Register an account or sign in to continue.

## Main screens

- `/login` and `/register` — validated authentication forms.
- `/dashboard` — workspace statistics, deadlines, activity, and projects.
- `/projects` and `/projects/:id` — create projects, manage members, and review work.
- `/projects/:id/board` — drag tasks between status columns or change status accessibly.
- `/tasks` and `/tasks/:id` — filter tasks, update status and priority, and discuss work.
- `/notifications` — review and mark persisted notifications as read. The
  workspace bell previews the latest five, supports expanding long messages,
  and marks an unread item read without leaving the current screen.
- `/profile` and `/settings` — update your profile and select the light or dark theme.

The profile menu and notification preview dismiss on Escape and outside
interaction; the profile menu also supports arrow-key navigation.

## Authentication and data

The API client keeps the access token in memory only. Refresh tokens remain in
the API's HttpOnly cookie; the browser never writes either token to local
storage. API requests include credentials and retry once after refreshing an
expired access token. Socket.IO uses the in-memory access token for authenticated
live notifications and task refreshes, with periodic notification polling as a
fallback.

The light and dark CSS variables in `app/globals.css` implement the TaskFlow
palette. The theme choice is stored locally as a display preference, not as
authentication data.

## Checks

```powershell
npm run lint
npm run build
```
