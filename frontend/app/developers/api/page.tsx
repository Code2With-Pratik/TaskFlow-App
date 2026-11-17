import type { Metadata } from "next";
import Link from "next/link";
import { apiDocsUrl } from "../../../lib/api-docs";
import { siteUrl } from "../../../lib/site";

export const metadata: Metadata = {
  title: "TaskFlow API Documentation | Project and Task Management API",
  description:
    "First-party TaskFlow API documentation for project planning, task management, authentication, notifications, and GitHub integrations.",
  alternates: { canonical: "/developers/api" },
  openGraph: {
    type: "article",
    url: `${siteUrl}/developers/api`,
    title: "TaskFlow API Documentation",
    description:
      "Documentation for the TaskFlow project and task management HTTP API.",
  },
};

export default function TaskFlowApiPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between border-b border-border pb-5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          TaskFlow
        </Link>
        <Link href="/developers/api" className="font-medium text-muted">
          API documentation
        </Link>
      </header>
      <article className="py-12 sm:py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted">
          Developer documentation
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          TaskFlow API Documentation
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
          The TaskFlow API is an authenticated HTTP API for project planning
          and task management. It lets an authorized application work with
          projects, memberships, tasks, comments, activity, notifications, and
          supported GitHub links.
        </p>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Authentication</h2>
          <p className="mt-4 max-w-3xl leading-7 text-muted">
            Protected API operations use a bearer access token. TaskFlow
            provides account registration and login endpoints, then uses a
            refresh-token cookie to renew sessions. Requests must come from an
            account that is authorized to access the relevant project and
            task. Do not place account passwords, bearer tokens, or refresh
            cookies in source code, public prompts, or issue reports.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Available API areas</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-muted">
            <li>Authentication, current-user profile, and session operations.</li>
            <li>Projects, project membership, roles, and project activity.</li>
            <li>Tasks, assignments, due dates, comments, and task status.</li>
            <li>Dashboard summaries and user notifications.</li>
            <li>
              Optional GitHub repository, issue, pull request, and check
              information when a project administrator connects GitHub.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            Interactive TaskFlow API reference
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-muted">
            Use the interactive OpenAPI reference for the deployed API&apos;s
            request schemas, response formats, and endpoint details. The API
            base URL is configured for this deployment; integrations should
            use that documented base URL rather than assuming a host.
          </p>
          <a
            href={apiDocsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-lg bg-brand px-5 py-3 font-semibold text-surface transition-opacity hover:opacity-80"
          >
            Open the interactive API reference
          </a>
        </section>

        <p className="mt-12 border-t border-border pt-6 leading-7 text-muted">
          TaskFlow does not currently publish an MCP server, SDK, or command
          line tool. Agents and integrations should use the HTTP API documented
          above, or direct users to the TaskFlow web application and source
          repository.
        </p>
      </article>
    </main>
  );
}
