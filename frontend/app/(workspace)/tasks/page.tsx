"use client";

import { CheckCircle2, ListTodo, Search, SlidersHorizontal } from "@/components/animated-icons";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { IconHover } from "@/components/icon-hover";
import { ErrorState, LoadingState } from "@/components/query-state";
import { TaskRow } from "@/components/task-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/ui/page-heading";
import { apiFetch } from "@/lib/api";
import type { PaginatedTasks, TaskStatus } from "@/types/api";

type TaskFilter = TaskStatus | "ALL" | "OVERDUE";

const statuses: Array<{
  value: TaskFilter;
  label: string;
  tone?: string;
}> = [
  { value: "ALL", label: "All tasks" },
  { value: "OVERDUE", label: "Overdue", tone: "bg-warning" },
  { value: "TODO", label: "To do", tone: "bg-danger" },
  { value: "IN_PROGRESS", label: "In progress", tone: "bg-warning" },
  { value: "BLOCKED", label: "Blocked", tone: "bg-danger" },
  { value: "DONE", label: "Done", tone: "bg-success" },
];

function getRequestedStatus(): TaskFilter {
  if (typeof window === "undefined") return "ALL";
  const requestedStatus = new URLSearchParams(window.location.search).get("status");
  return statuses.find((item) => item.value === requestedStatus)?.value ?? "ALL";
}

function subscribeToLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

export default function TasksPage() {
  const routeStatus = useSyncExternalStore(
    subscribeToLocation,
    getRequestedStatus,
    () => "ALL",
  );
  const [selectedStatus, setSelectedStatus] = useState<TaskFilter | null>(null);
  const status = selectedStatus ?? routeStatus;
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const mobileFilterRef = useRef<HTMLDivElement>(null);
  const mobileFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
  const [pagination, setPagination] = useState({ filterKey: "", page: 1 });
  const pageSize = 20;
  const filterKey = `${status}\u0000${debouncedSearch}`;
  const page = pagination.filterKey === filterKey ? pagination.page : 1;

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      100,
    );
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!filterOpen) return;

    function dismissOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !mobileFilterRef.current?.contains(event.target)
      ) {
        setFilterOpen(false);
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFilterOpen(false);
        mobileFilterTriggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [filterOpen]);

  const query = useQuery({
    queryKey: ["tasks", status, debouncedSearch, page],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        limit: String(pageSize),
        page: String(page),
      });
      if (status === "OVERDUE") params.set("overdue", "true");
      else if (status !== "ALL") params.set("status", status);
      if (debouncedSearch) params.set("search", debouncedSearch);
      return apiFetch<PaginatedTasks>(`/tasks?${params.toString()}`, { signal });
    },
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === status ? previousData : undefined,
  });

  if (query.isLoading) return <LoadingState label="Loading your tasks…" />;
  if (query.error) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const tasks = query.data?.data ?? [];

  return (
    <div>
      <PageHeading
        eyebrow="Your work"
        title="My tasks"
        description="A focused list of tasks from every project you belong to."
      />
      <section aria-label="Task filters" className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <IconHover>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search task titles and descriptions"
                aria-label="Search tasks"
              />
            </div>
          </IconHover>
          <div className="relative sm:hidden" ref={mobileFilterRef}>
            <button
              ref={mobileFilterTriggerRef}
              type="button"
              className="task-filter-trigger"
              aria-label={`Filter tasks. Current filter: ${statuses.find((item) => item.value === status)?.label ?? "All tasks"}`}
              aria-expanded={filterOpen}
              aria-haspopup="true"
              aria-controls="mobile-task-status-filters"
              onClick={() => setFilterOpen((open) => !open)}
            >
              <SlidersHorizontal size={17} aria-hidden="true" />
              {status !== "ALL" ? <span className="task-filter-indicator" aria-hidden="true" /> : null}
            </button>
            {filterOpen ? (
              <div
                id="mobile-task-status-filters"
                className="task-filter-menu"
                role="group"
                aria-label="Task status filters"
              >
                {statuses.map((item) => (
                  <button
                    key={item.value}
                    className={`task-filter-option ${
                      status === item.value ? "task-filter-option-selected" : ""
                    }`}
                    aria-pressed={status === item.value}
                    onClick={() => {
                      setSelectedStatus(item.value);
                      setFilterOpen(false);
                      mobileFilterTriggerRef.current?.focus();
                    }}
                    type="button"
                  >
                    <span className="flex items-center">
                      {item.tone ? (
                        <span
                          aria-hidden="true"
                          className={`mr-2 inline-block size-1.5 rounded-full ${item.tone}`}
                        />
                      ) : null}
                      {item.label}
                    </span>
                    {status === item.value ? <CheckCircle2 size={14} aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <IconHover>
          <div className="scrollbar-hidden hidden items-center gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1 sm:flex" role="group" aria-label="Task status filters" tabIndex={0}>
            <SlidersHorizontal className="ml-2 shrink-0 text-muted" size={15} />
            {statuses.map((item) => (
              <button
                key={item.value}
                className={`shrink-0 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                  status === item.value
                    ? "primary-action bg-black text-white"
                    : "text-muted hover:bg-surface-secondary hover:text-foreground"
                }`}
                aria-pressed={status === item.value}
                onClick={() => setSelectedStatus(item.value)}
                type="button"
              >
                {item.tone ? (
                  <span
                    aria-hidden="true"
                    className={`mr-1.5 inline-block size-1.5 rounded-full ${item.tone}`}
                  />
                ) : null}
                {item.label}
              </button>
            ))}
          </div>
        </IconHover>
      </section>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between px-3 pt-1">
            <p className="text-xs font-medium text-muted">
              {query.data?.total
                ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(
                    page * pageSize,
                    query.data.total,
                  )} of ${query.data.total} tasks`
                : `${query.data?.total ?? 0} tasks`}
            </p>
            {query.isFetching ? <Badge>Updating</Badge> : null}
          </div>
          {tasks.length ? (
            <div className="divide-y divide-border">
              {tasks.map((task) => <TaskRow key={task.id} task={task} />)}
            </div>
          ) : (
            <EmptyState
              icon={search || status !== "ALL" ? CheckCircle2 : ListTodo}
              title={search || status !== "ALL" ? "No matching tasks" : "You’re all caught up"}
              description={
                search || status !== "ALL"
                  ? "Try a different search term or status filter."
                  : "Tasks from your projects will appear here."
              }
            />
          )}
          {query.data && query.data.total > pageSize ? (
            <div className="mt-4 flex items-center justify-between border-t border-border px-3 pt-4">
              <Button
                disabled={page === 1 || query.isFetching}
                onClick={() =>
                  setPagination({ filterKey, page: Math.max(1, page - 1) })
                }
                size="sm"
                variant="secondary"
              >
                Previous
              </Button>
              <span className="text-xs text-muted">
                Page {page} of {Math.ceil(query.data.total / pageSize)}
              </span>
              <Button
                disabled={page * pageSize >= query.data.total || query.isFetching}
                onClick={() => setPagination({ filterKey, page: page + 1 })}
                size="sm"
                variant="secondary"
              >
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
