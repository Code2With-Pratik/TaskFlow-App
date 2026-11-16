# Deploy TaskFlow: Vercel frontend + Render API

This project deploys as two separate services:

- **Frontend:** Next.js from the `frontend/` directory, hosted on Vercel.
- **API:** NestJS from the `backend/` directory, hosted on Render.
- **Database:** PostgreSQL, hosted on Render and connected to the API.

The existing Render URL `https://taskflow-app-w4mm.onrender.com` currently
serves the frontend, not the NestJS API. Do not configure it as the API URL
unless you deliberately redeploy that service as the backend. Create a separate
Render API service and use its new `*.onrender.com` URL below.

## 1. Push the project to GitHub

Push the complete repository, including `frontend/`, `backend/`, Prisma
migrations, `render.yaml`, and this guide. Do not commit `.env` files,
production database URLs, or private credentials.

## 2. Create the Render PostgreSQL database

1. In Render, choose **New → PostgreSQL**.
2. Name the database and choose a plan and region.
3. Create it and wait until its status is available.
4. Copy the **Internal Database URL**. Keep it private; you will add it to the
   API service as `DATABASE_URL`. Prefer placing the API and database in the
   same Render region so the service can use the internal URL.
5. Review the database plan's storage, backup, and expiration limits before
   using it for production data.

## 3. Create a separate Render API service

You can create it from the included `render.yaml` Blueprint, or manually:

1. In Render, select **New → Web Service** and connect the GitHub repository.
2. Set **Root Directory** to `backend`.
3. Use the Node runtime (not Docker) and configure:

   | Setting | Value |
   | --- | --- |
   | Build Command | `npm ci --include=dev && npm run build` |
   | Start Command | `npm run db:migrate:deploy && npm run start:prod` |
   | Health Check Path | `/health` |

4. Add these environment variables to the API service:

   | Name | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | `https://task-flow-app-delta-one.vercel.app` |
   | `DATABASE_URL` | Internal URL from the Render PostgreSQL database |
   | `JWT_ACCESS_SECRET` | A randomly generated secret with at least 32 characters |
   | `JWT_REFRESH_SECRET` | A different randomly generated secret with at least 32 characters |

   Render supplies `PORT`; do not hard-code it. If using a custom frontend
   domain or Vercel preview deployment, append each exact origin to
   `FRONTEND_URL`, separated by commas, for example:
   `https://task-flow-app-delta-one.vercel.app,https://www.example.com`.
   Do not add a trailing slash to an origin.

5. Deploy and wait for the service to become healthy. Render runs Prisma
   migrations before starting the API.
6. Open `https://<your-api-service>.onrender.com/health`. Confirm it responds
   with HTTP 200 and JSON containing `"status":"ok"`. If it fails, inspect the
   Render API service's deploy/runtime logs, verify its environment variables,
   and confirm the database is available.

Keep the database URL and JWT secrets in Render's environment settings only.
Never paste them into source code, a public issue, or a Vercel frontend
variable.

## 4. Configure and deploy the Vercel frontend

1. In Vercel, import the same GitHub repository (or open the existing
   frontend project).
2. Set **Root Directory** to `frontend`. Leave the framework preset as
   **Next.js** and the build/output settings at their Next.js defaults.
3. In **Settings → Environment Variables**, set:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | `https://<your-api-service>.onrender.com` |

   Use the new Nest API's origin only—do not append `/health`, `/api`, or a
   trailing slash. This is a public frontend setting, not a secret. Add it to
   **Production** and to **Preview** only if preview deployments should call
   the production API.
4. Save the variable and redeploy Vercel. `NEXT_PUBLIC_API_URL` is embedded
   during the frontend build, so changing it without redeploying will not update
   the deployed app.
5. Open `https://task-flow-app-delta-one.vercel.app/login`. The backend status
   should become connected; then register a test account and verify login.

## 5. Verify the complete deployment

1. Check the API health endpoint returns JSON:
   `https://<your-api-service>.onrender.com/health`.
2. Check the frontend opens:
   `https://task-flow-app-delta-one.vercel.app/`.
3. Register a test user, sign out, sign in again, and reload a protected page
   to check refresh-cookie behavior.
4. Create a project and task, then verify the dashboard and notifications.
5. In browser developer tools, confirm requests go to the new API host and
   that there are no CORS, failed-fetch, or mixed-content errors.
6. In Render, check the API and PostgreSQL logs/health. In Vercel, check the
   latest deployment and build logs.

Vercel and the default Render domain are different sites. The API sets its
production refresh cookie with `SameSite=None; Secure` so credentialed browser
requests can include it. Some browser privacy settings block third-party
cookies; if refresh sessions do not persist in those browsers, use custom
frontend and API hostnames under the same registrable domain.

## 6. Redeploy after future changes

- **Frontend code or `NEXT_PUBLIC_API_URL`:** push changes and redeploy Vercel.
- **API code or migration:** push changes and redeploy the Render API. The
  configured start command applies pending Prisma migrations.
- **Frontend origin/CORS change:** update Render's `FRONTEND_URL` and redeploy
  the API.
- **Database/JWT secret change:** update the Render environment deliberately.
  Changing JWT secrets invalidates existing access/refresh sessions.

## Optional: deploy with the Render Blueprint

The root `render.yaml` defines the NestJS web service and its health check.
Create a Blueprint in Render from the repository, provide the prompted
`DATABASE_URL`, and confirm the generated JWT secrets and frontend origin
before applying it. Create the Render PostgreSQL database first; the blueprint
does not create or migrate a database server.
