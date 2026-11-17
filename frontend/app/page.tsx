import Link from "next/link";
import { apiDocsUrl } from "../lib/api-docs";
import { siteUrl } from "../lib/site";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "TaskFlow",
      alternateName: ["TaskFlow by Pratik Dhandare", "Code2WithPratik"],
      url: siteUrl,
      founder: {
        "@type": "Person",
        name: "Pratik Dhandare",
        url: "https://github.com/Code2With-Pratik",
      },
      sameAs: ["https://github.com/Code2With-Pratik"],
    },
    {
      "@type": "SoftwareApplication",
      name: "TaskFlow",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Project and task management software for planning work, coordinating teams, and tracking delivery.",
      url: siteUrl,
      creator: {
        "@type": "Person",
        name: "Pratik Dhandare",
      },
      keywords:
        "TaskFlow task management, TaskFlow project planning, project management software, team collaboration, task tracking",
      knowsAbout: [
        "TaskFlow task management",
        "TaskFlow project planning",
        "Team collaboration",
        "TaskFlow API",
      ],
    },
  ],
};

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground"
          aria-label="TaskFlow home"
        >
          TaskFlow
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-5">
          <Link
            href="/login"
            className="font-medium text-muted transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-surface transition-opacity hover:opacity-80"
          >
            Get started
          </Link>
        </nav>
      </header>

      <div className="flex flex-1 flex-col justify-center py-16 sm:py-24">
        <section aria-labelledby="hero-title" className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted">
            Make meaningful work move forward
          </p>
          <h1
            id="hero-title"
            className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl"
          >
            TaskFlow task management and project planning
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            TaskFlow is project management software for teams that want a
            clearer way to plan projects, organize tasks, and see what needs
            attention. Bring project conversations, assignments, and progress
            into one focused workspace, so everyone knows what is happening and
            what to do next.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-brand px-5 py-3 font-semibold text-surface transition-opacity hover:opacity-80"
            >
              Create your workspace
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-border px-5 py-3 font-semibold text-foreground transition-colors hover:bg-surface-secondary"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="features-title"
          className="mt-20 grid gap-10 border-t border-border pt-10 md:grid-cols-3"
        >
          <div>
            <h2 id="features-title" className="text-lg font-semibold">
              Plan projects with clarity
            </h2>
            <p className="mt-3 leading-7 text-muted">
              Create projects, define the work, and give teammates a shared
              place to understand priorities. Project boards make active tasks
              and their status easier to scan, while project details keep
              relevant activity close to the work.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Coordinate every task</h2>
            <p className="mt-3 leading-7 text-muted">
              Assign owners, set due dates, update task status, and discuss
              details with comments and mentions. TaskFlow keeps work
              accountable without losing the context people need to complete
              it.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">See progress and next steps</h2>
            <p className="mt-3 leading-7 text-muted">
              Use the dashboard to review projects and approaching deadlines.
              Notifications keep teammates informed about assignments,
              invitations, comments, and changes, helping a team decide what
              deserves attention next.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="integrations-title"
          className="mt-14 max-w-3xl border-t border-border pt-10"
        >
          <h2 id="integrations-title" className="text-2xl font-semibold">
            A connected workspace for teams
          </h2>
          <p className="mt-4 leading-7 text-muted">
            TaskFlow is a web-based project and task management application
            built with a Next.js frontend and a NestJS API. Optional GitHub App
            integration connects repositories, issues, and pull requests with
            project tasks, so engineering teams can keep delivery work linked
            to its source. Role-aware project membership helps teams share work
            with the right people, and authenticated access protects each
            person&apos;s workspace.
          </p>
          <p className="mt-4 leading-7 text-muted">
            Whether you are coordinating a small team or tracking work across
            several projects, TaskFlow provides a practical place to organize
            tasks, collaborate, and follow progress from planning through
            completion.
          </p>
        </section>

        <section
          aria-labelledby="developers-title"
          className="mt-14 border-t border-border pt-10"
        >
          <h2 id="developers-title" className="text-2xl font-semibold">
            TaskFlow API and developer resources
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-muted">
            Developers can explore the TaskFlow API reference and the source
            code for the web application and NestJS backend. The API reference
            documents the HTTP endpoints used by TaskFlow. Learn about the
            project, review its implementation, or contribute through the
            Code2With-Pratik GitHub organization.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <a
                className="font-medium underline underline-offset-4"
                href={apiDocsUrl}
                target="_blank"
                rel="noreferrer"
              >
                TaskFlow API reference
              </a>
            </li>
            <li>
              <Link
                className="font-medium underline underline-offset-4"
                href="/developers/api"
              >
                TaskFlow API documentation
              </Link>
            </li>
            <li>
              <a
                className="font-medium underline underline-offset-4"
                href="https://github.com/Code2With-Pratik/TaskFlow-App"
                target="_blank"
                rel="noreferrer"
              >
                TaskFlow on GitHub
              </a>
            </li>
            <li>
              <Link
                className="font-medium underline underline-offset-4"
                href="/llms.txt"
              >
                Agent and AI documentation
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <footer className="flex flex-col gap-2 border-t border-border pt-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>TaskFlow by Pratik Dhandare · Code2WithPratik</p>
        <nav aria-label="Company information" className="flex flex-wrap gap-4">
          <Link href="/about" className="underline underline-offset-4">
            About
          </Link>
          <Link href="/contact" className="underline underline-offset-4">
            Contact
          </Link>
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy
          </Link>
          <a
            href="https://github.com/Code2With-Pratik"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            GitHub: Code2With-Pratik
          </a>
        </nav>
      </footer>
    </main>
  );
}
