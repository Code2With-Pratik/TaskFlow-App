<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## TaskFlow

TaskFlow is a project and task workspace with a Next.js frontend, NestJS API,
and PostgreSQL database. The frontend is served on port `3001` and the API on
port `3000`.

For the full production deployment walkthrough, see
[DEPLOYMENT.md](./DEPLOYMENT.md).

## Run the full stack with Docker Compose

1. Copy `.env.docker.example` to `.env.docker`.
2. Replace the PostgreSQL password and both JWT secrets with unique random
   values. Use hexadecimal secrets so the database URL remains valid.
3. Build and start the complete stack:

   ```powershell
   docker compose --env-file .env.docker up --build -d
   ```

   Compose waits for PostgreSQL, applies Prisma migrations, then starts the
   API and frontend.
4. Open [http://localhost:3001](http://localhost:3001), register an account,
   and sign in. The API documentation is at
   [http://localhost:3000/api/docs](http://localhost:3000/api/docs).

Useful commands:

```powershell
docker compose --env-file .env.docker logs -f
docker compose --env-file .env.docker down
```

PostgreSQL data is stored in the `taskflow_postgres_data` volume and is
preserved when the containers are stopped. To remove the database volume as
well, run `docker compose --env-file .env.docker down -v`.

The root `Dockerfile` builds the frontend as a minimal Next.js standalone
image. `backend/Dockerfile` builds the API and provides a separate migration
target used by Compose. The API and database ports are bound to loopback by
default; adjust the compose port mappings deliberately when deploying beyond
local development.

## Deploying to Vercel and Render

Set the Vercel project root to `frontend`. Configure this environment variable
for Production (and Preview if those deployments need the API):

```text
NEXT_PUBLIC_API_URL=https://<your-nest-api-service>.onrender.com
```

Use the API service origin only—do not add `/health` or `/api`. This variable
is embedded at build time, so redeploy Vercel after changing it.

The Render URL previously used by the app,
`https://taskflow-app-w4mm.onrender.com`, is serving the Next.js frontend, not
the NestJS API: `/health` currently returns a Next.js 404. Create a separate
Render Web Service from this repository with **Root Directory** `backend`,
**Build Command** `npm ci --include=dev && npm run build`, **Start Command**
`npm run db:migrate:deploy && npm run start:prod`, and **Health Check Path**
`/health`. Add these environment variables to that API service:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://task-flow-app-delta-one.vercel.app` |
| `DATABASE_URL` | Render PostgreSQL internal URL (or your PostgreSQL connection URL) |
| `JWT_ACCESS_SECRET` | A unique random secret of at least 32 characters |
| `JWT_REFRESH_SECRET` | A different unique random secret of at least 32 characters |

Render supplies `PORT`. Keep the database URL and JWT secrets private. Once
the API is deployed, verify that
`https://<your-nest-api-service>.onrender.com/health` returns JSON with
`"status":"ok"`. Then set that service URL in Vercel as
`NEXT_PUBLIC_API_URL` and redeploy. `FRONTEND_URL` must match the Vercel origin
exactly. Add other Vercel preview/custom origins as comma-separated URLs.

Because Vercel and Render use different sites, the production refresh cookie
uses `SameSite=None; Secure`. Browsers that block third-party cookies may
restrict refresh-token persistence; custom frontend and API hostnames under
the same site are the most reliable long-term setup.

## Optional: connect GitHub

GitHub issue and pull-request linking uses a GitHub App. Create an App and set
its Setup URL to
`https://<your-api-service>.onrender.com/integrations/github/callback` and its
webhook URL to `https://<your-api-service>.onrender.com/integrations/github/webhook`.
Subscribe to `installation`, `pull_request`, and `pull_request_review` events.
Grant read-only repository metadata, issues, and pull requests permissions.

Add these secrets to the Render API service (never to Vercel or source control):

| Variable | Value |
| --- | --- |
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_APP_SLUG` | App slug from its GitHub URL |
| `GITHUB_APP_PRIVATE_KEY` | Contents of the App's downloaded private key |
| `GITHUB_APP_WEBHOOK_SECRET` | The webhook secret configured in the GitHub App |

Set all four variables together and redeploy. Until configured, GitHub controls
remain disabled. Project owners/admins can install the App for a project,
select repositories, and link issues or pull requests to tasks. Pull-request
state and review summaries update through verified GitHub webhooks. Projects
may opt into moving linked tasks to Done when a PR is merged.

Project invitations are in-app only: invited collaborators must already have
a TaskFlow account, and they join after accepting the invitation from their
notifications. Task comments support replies and project-member mentions.

## Run and test locally

The easiest way to start the API, PostgreSQL, and frontend together is the
Docker Compose flow above. For separate development servers, start PostgreSQL,
then run these commands in separate terminals from the repository root:

```powershell
Set-Location .\backend
npm ci
npm run db:generate
npm run start:dev
```

```powershell
Set-Location .\frontend
npm ci
npm run dev -- --port 3001
```

Backend checks (run from `backend/`):

```powershell
npm run build
npm run lint
npm test
npm run test:e2e
```

Frontend checks (run from `frontend/`):

```powershell
npm run lint
npm run build
```

For production deployment, follow [DEPLOYMENT.md](./DEPLOYMENT.md).

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

This project is already instrumented. To connect it, run this and approve the code it prints at [observe.nestjs.com/link](https://observe.nestjs.com/link) - signing up for free if you have no account:

```bash
$ npx @nestjs/observe link
```

It writes the app key and secret into `.env` and makes every `nest start` script (`start`, `start:dev`, `start:debug`) load it. In production, set `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment instead.

Or do it by hand: create an application and an API key at [observe.nestjs.com](https://observe.nestjs.com), and set the pair as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment the app runs in.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch.

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License.

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
