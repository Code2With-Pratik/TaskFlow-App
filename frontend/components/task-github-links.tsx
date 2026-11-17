"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, Trash2 } from "@/components/animated-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch, getErrorMessage } from "@/lib/api";
import type { TaskGitHubLink } from "@/types/api";

export function TaskGitHubLinks({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const query = useQuery({
    queryKey: ["task-github-links", taskId],
    queryFn: () =>
      apiFetch<TaskGitHubLink[]>(`/tasks/${taskId}/github-links`),
    refetchInterval: 60_000,
  });
  const addLink = useMutation({
    mutationFn: (linkUrl: string) =>
      apiFetch<TaskGitHubLink>(`/tasks/${taskId}/github-links`, {
        method: "POST",
        body: JSON.stringify({ url: linkUrl }),
      }),
    onSuccess: async () => {
      setUrl("");
      await queryClient.invalidateQueries({
        queryKey: ["task-github-links", taskId],
      });
    },
  });
  const removeLink = useMutation({
    mutationFn: (linkId: string) =>
      apiFetch<void>(`/tasks/${taskId}/github-links/${linkId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["task-github-links", taskId] }),
  });

  const error = query.error ?? addLink.error ?? removeLink.error;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Developer work</h2>
          <Badge>{query.data?.length ?? 0}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {error ? (
          <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger-foreground" role="alert">
            {getErrorMessage(error)}
          </p>
        ) : null}
        {query.isLoading ? (
          <p className="text-xs text-muted">Loading linked GitHub work…</p>
        ) : query.data?.length ? (
          <ul className="space-y-2">
            {query.data.map((link) => (
              <li
                className="rounded-xl border border-border p-3"
                key={link.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <a
                    className="min-w-0 flex-1 text-xs font-medium leading-5 text-foreground hover:text-brand"
                    href={link.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="block truncate">{link.repository.fullName} #{link.number}</span>
                    <span className="mt-1 block line-clamp-2 text-muted">{link.title}</span>
                  </a>
                  <a
                    aria-label={`Open ${link.type.toLowerCase()} on GitHub`}
                    className="text-muted hover:text-brand"
                    href={link.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    aria-label="Remove GitHub link"
                    className="text-muted hover:text-danger-foreground"
                    disabled={removeLink.isPending}
                    onClick={() => removeLink.mutate(link.id)}
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge>{link.type === "PULL_REQUEST" ? "Pull request" : "Issue"}</Badge>
                  <Badge>{link.state.toLowerCase()}</Badge>
                  {link.isDraft ? <Badge>Draft</Badge> : null}
                  {link.checkStatus ? (
                    <Badge>Checks {link.checkStatus.toLowerCase().replaceAll("_", " ")}</Badge>
                  ) : null}
                  {link.reviewState ? (
                    <Badge>{link.reviewState.replaceAll("_", " ").toLowerCase()}</Badge>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs leading-5 text-muted">
            Link a GitHub issue or pull request to keep implementation and review status with this task.
          </p>
        )}
        <p className="text-[11px] leading-5 text-muted">
          Auto-link a pull request by including{" "}
          <code className="break-all rounded bg-surface-secondary px-1 text-foreground">
            taskflow:{taskId}
          </code>{" "}
          in its title or branch, or have it close an issue linked to this task.
        </p>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (url.trim()) addLink.mutate(url.trim());
          }}
        >
          <Input
            aria-label="GitHub issue or pull request URL"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://github.com/org/repo/pull/42"
            type="url"
            value={url}
          />
          <Button
            aria-label="Link GitHub work"
            disabled={!url.trim() || addLink.isPending}
            size="sm"
            type="submit"
          >
            <Plus size={14} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
