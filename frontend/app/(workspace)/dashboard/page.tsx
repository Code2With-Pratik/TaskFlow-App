"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  FolderKanban,
  ListTodo,
  Plus,
  TriangleAlert,
} from "@/components/animated-icons";
import { useQuery } from "@tanstack/react-query";
import { ActivityRow } from "@/components/activity-row";
import { ErrorState, LoadingState } from "@/components/query-state";
import { IconHover } from "@/components/icon-hover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { DashboardSummary, Project } from "@/types/api";

const statCards = [
  {
    key: "totalProjects",
    label: "Active projects",
    href: "/projects",
    icon: FolderKanban,
    iconClass: "bg-brand/10 text-brand",
  },
  {
    key: "totalTasks",
    label: "Total tasks",
    href: "/tasks",
    icon: ListTodo,
    iconClass: "bg-surface-secondary text-muted",
  },
  {
    key: "completedTasks",
    label: "Completed",
    href: "/tasks?status=DONE",
    icon: CheckCircle2,
    iconClass: "bg-success/10 text-success",
  },
  {
    key: "overdueTasks",
    label: "Overdue",
    href: "/tasks?status=OVERDUE",
    icon: CalendarClock,
    iconClass: "bg-warning/10 text-warning",
  },
  {
    key: "blockedTasks",
    label: "Blocked",
    href: "/tasks?status=BLOCKED",
    icon: TriangleAlert,
    iconClass: "bg-danger/10 text-danger-foreground",
  },
] as const;

export default function DashboardPage() {
  const summary = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardSummary>("/dashboard/summary"),
  });
  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetch<Project[]>("/projects"),
  });

  if (summary.isLoading || projects.isLoading) {
    return <LoadingState label="Preparing your workspace…" />;
  }
  if (summary.error || projects.error) {
    return (
      <ErrorState
        error={summary.error ?? projects.error}
        onRetry={() => {
          void summary.refetch();
          void projects.refetch();
        }}
      />
    );
  }

  const data = summary.data;
  if (!data) {
    return <ErrorState error={new Error("Dashboard data is missing.")} onRetry={() => void summary.refetch()} />;
  }

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Your workspace"
        title="A clear view of your work"
        description="Here’s what’s moving across your projects today."
        action={
          <Link href="/projects">
            <Button>
              <Plus size={16} />
              New project
            </Button>
          </Link>
        }
      />

      <section
        aria-label="Workspace statistics"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5 xl:gap-4"
      >
        {statCards.map(({ key, label, href, icon: Icon, iconClass }) => (
          <Link
            aria-label={`${label}: ${data.stats[key]}. View ${label.toLowerCase()}.`}
            className="group rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.99]"
            href={href}
            key={key}
          >
            <Card className="h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:border-brand/30 group-hover:shadow-md group-focus-visible:border-brand/40">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-muted">{label}</p>
                  <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${iconClass}`}>
                    <Icon size={16} />
                  </span>
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                  {data.stats[key]}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {key === "totalTasks" ? (
                    <>
                      <span className="font-medium text-danger-foreground">
                        {data.stats.pendingTasks}
                      </span>{" "}
                      to do ·{" "}
                      <span className="font-medium text-warning">
                        {data.stats.inProgressTasks}
                      </span>{" "}
                      in progress
                    </>
                  ) : key === "completedTasks"
                      ? "Across your workspace"
                      : key === "overdueTasks"
                        ? "Need a little attention"
                        : "You’re a member of"}
                  {key === "totalProjects" ? " your projects" : ""}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section
        aria-label="Developer daily work"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">My tasks</h2>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {data.developerWork.myTasks.length ? (
              data.developerWork.myTasks.map((task) => (
                <Link
                  className="block rounded-lg hover:bg-surface-secondary"
                  href={`/tasks/${task.id}`}
                  key={task.id}
                >
                  <span className="block truncate text-xs font-medium text-foreground">{task.title}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted">
                    <span className="truncate">{task.project.name}</span>
                    <Badge>{task.status}</Badge>
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-xs text-muted">No open tasks assigned to you.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Blocked work</h2>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {data.developerWork.blockedTasks.length ? (
              data.developerWork.blockedTasks.map((task) => (
                <Link
                  className="block rounded-lg hover:bg-surface-secondary"
                  href={`/tasks/${task.id}`}
                  key={task.id}
                >
                  <span className="block truncate text-xs font-medium text-foreground">{task.title}</span>
                  <span className="mt-1 block truncate text-[10px] text-muted">{task.project.name}</span>
                </Link>
              ))
            ) : (
              <p className="text-xs text-muted">No blocked tasks in your projects.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Pull requests to review</h2>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {data.developerWork.reviewPullRequests.length ? (
              data.developerWork.reviewPullRequests.map((pullRequest) => (
                <div className="min-w-0" key={`${pullRequest.repository}-${pullRequest.number}-${pullRequest.taskId}`}>
                  <Link
                    className="block truncate text-xs font-medium text-foreground hover:underline"
                    href={`/tasks/${pullRequest.taskId}`}
                  >
                    {pullRequest.taskTitle}
                  </Link>
                  <a
                    className="mt-1 block truncate text-[10px] text-muted hover:underline"
                    href={pullRequest.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {pullRequest.repository} #{pullRequest.number} · {pullRequest.reviewState?.replaceAll("_", " ").toLowerCase()}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted">No linked pull requests are waiting for review.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Recently merged</h2>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {data.developerWork.recentlyMerged.length ? (
              data.developerWork.recentlyMerged.map((pullRequest) => (
                <div className="min-w-0" key={`${pullRequest.repository}-${pullRequest.number}-${pullRequest.taskId}`}>
                  <Link
                    className="block truncate text-xs font-medium text-foreground hover:underline"
                    href={`/tasks/${pullRequest.taskId}`}
                  >
                    {pullRequest.taskTitle}
                  </Link>
                  <a
                    className="mt-1 block truncate text-[10px] text-muted hover:underline"
                    href={pullRequest.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {pullRequest.repository} #{pullRequest.number} · {formatDate(pullRequest.mergedAt)}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted">Merged pull requests from the last 7 days appear here.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Upcoming deadlines
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Tasks due in the next seven days
                </p>
              </div>
              <Link
                href="/tasks"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                All tasks <ArrowRight size={13} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {data.upcomingDeadlines.length > 0 ? (
              <div className="divide-y divide-border">
                {data.upcomingDeadlines.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {task.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted">
                        {task.project.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-muted">
                      {formatDate(task.dueDate)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-7 text-center">
                <CircleDashed className="mx-auto text-muted" size={20} />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Nothing due soon
                </p>
                <p className="mt-1 text-xs text-muted">
                  New deadlines will show up here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Recent activity
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Updates from your projects
                </p>
              </div>
              <span className="grid size-8 place-items-center rounded-xl bg-surface-secondary text-muted">
                <ArrowUpRight size={16} />
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {data.recentActivities.length > 0 ? (
              <div className="divide-y divide-border">
                {data.recentActivities.slice(0, 5).map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="py-7 text-center text-xs text-muted">
                Project updates will appear here.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Your projects
            </h2>
            <p className="mt-1 text-xs text-muted">
              Keep your team’s work within reach.
            </p>
          </div>
          <IconHover>
            <Link
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              href="/projects"
            >
              View all <ArrowRight size={13} />
            </Link>
          </IconHover>
        </div>
        {projects.data?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projects.data.slice(0, 3).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-2xl border border-border bg-surface p-5 shadow-sm shadow-slate-950/[0.025] transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
                    <FolderKanban size={17} />
                  </span>
                  <span className="text-muted transition group-hover:text-brand">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
                <h3 className="mt-4 truncate text-sm font-semibold text-foreground">
                  {project.name}
                </h3>
                <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted">
                  {project.description || "A focused space for your team's work."}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                  <span>{project._count?.tasks ?? 0} tasks</span>
                  <span>{project._count?.members ?? 0} members</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FolderKanban}
            title="Start with a project"
            description="Create a project to give your team's work a shared home."
            action={
              <Link href="/projects">
                <Button size="sm">
                  <Plus size={15} /> Create a project
                </Button>
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
