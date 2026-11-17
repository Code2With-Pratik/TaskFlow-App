"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "@/components/animated-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GitHubIssueSearchResult, GitHubRepository } from "@/types/api";
import { apiFetch, getErrorMessage } from "@/lib/api";
import Link from "next/link";

export function GitHubIssuesBrowser({
  projectId,
  repositories,
}: {
  projectId: string;
  repositories: GitHubRepository[];
}) {
  const queryClient = useQueryClient();
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());
  const repositoryId = repositories.some(
    (repository) => repository.id === selectedRepositoryId,
  )
    ? selectedRepositoryId
    : (repositories[0]?.id ?? "");
  const issuesQuery = useQuery({
    queryKey: [
      "github-issues",
      projectId,
      repositoryId,
      deferredSearch,
      page,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        repositoryId,
        page: String(page),
      });
      if (deferredSearch) params.set("search", deferredSearch);
      return apiFetch<GitHubIssueSearchResult>(
        `/projects/${projectId}/github/issues?${params.toString()}`,
      );
    },
    enabled: Boolean(repositoryId),
  });
  const addIssue = useMutation({
    mutationFn: ({ repositoryId, number }: { repositoryId: string; number: number }) =>
      apiFetch<{ id: string; title: string; projectId: string }>(
        `/projects/${projectId}/github/issues/${repositoryId}/${number}/task`,
        { method: "POST" },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["github-issues", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
      ]);
    },
  });
  const error = issuesQuery.error ?? addIssue.error;

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">GitHub issues</h3>
        <p className="mt-1 text-xs text-muted">
          Search open issues and add one as a project task.
        </p>
      </div>
      {repositories.length ? (
        <>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <select
              aria-label="Filter issues by repository"
              className="h-10 min-w-0 rounded-xl border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-brand"
              onChange={(event) => {
                setSelectedRepositoryId(event.target.value);
                setPage(1);
              }}
              value={repositoryId}
            >
              {repositories.map((repository) => (
                <option key={repository.id} value={repository.id}>
                  {repository.fullName}
                </option>
              ))}
            </select>
            <Input
              aria-label="Search GitHub issues"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search open issues"
              value={search}
            />
          </div>
          {error ? (
            <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger-foreground" role="alert">
              {getErrorMessage(error)}
            </p>
          ) : null}
          {issuesQuery.isLoading ? (
            <p className="text-xs text-muted">Loading GitHub issues…</p>
          ) : issuesQuery.data?.issues.length ? (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {issuesQuery.data.issues.map((issue) => (
                <li
                  className="flex items-start gap-3 p-3"
                  key={issue.number}
                >
                  <div className="min-w-0 flex-1">
                    <a
                      className="text-xs font-medium text-foreground hover:underline"
                      href={issue.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      #{issue.number} {issue.title}
                      <ExternalLink className="ml-1 inline" size={12} />
                    </a>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                      {issue.body || "No description"}
                    </p>
                  </div>
                  {issue.linkedTask ? (
                    <Link
                      className="shrink-0"
                      href={`/tasks/${issue.linkedTask.id}`}
                    >
                      <Badge>Added</Badge>
                    </Link>
                  ) : (
                    <Button
                      disabled={addIssue.isPending}
                      onClick={() =>
                        addIssue.mutate({
                          repositoryId,
                          number: issue.number,
                        })
                      }
                      size="sm"
                    >
                      Add task
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border px-3 py-5 text-center text-xs text-muted">
              {deferredSearch
                ? "No open issues match that search."
                : "No open issues found in this repository."}
            </p>
          )}
          {issuesQuery.data && issuesQuery.data.totalCount > 30 ? (
            <div className="flex items-center justify-between">
              <Button
                disabled={page === 1 || issuesQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                size="sm"
                variant="ghost"
              >
                Previous
              </Button>
              <span className="text-xs text-muted">
                Page {page} · {issuesQuery.data.totalCount} matching issues
              </span>
              <Button
                disabled={
                  page >= 10 ||
                  page * 30 >= issuesQuery.data.totalCount ||
                  issuesQuery.isFetching
                }
                onClick={() => setPage((current) => current + 1)}
                size="sm"
                variant="ghost"
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-xs text-muted">
          Add a repository above to browse its issues.
        </p>
      )}
    </section>
  );
}
