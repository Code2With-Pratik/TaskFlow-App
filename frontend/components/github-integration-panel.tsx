"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiFetch, getErrorMessage } from "@/lib/api";
import type {
  GitHubAvailableRepository,
  GitHubProjectIntegration,
  GitHubRepository,
} from "@/types/api";

export function GitHubIntegrationPanel({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const [selectedRepository, setSelectedRepository] = useState("");
  const settingsQuery = useQuery({
    queryKey: ["github-project", projectId],
    queryFn: () =>
      apiFetch<GitHubProjectIntegration>(`/projects/${projectId}/github`),
  });
  const availableRepositoriesQuery = useQuery({
    queryKey: ["github-available-repositories", projectId],
    queryFn: () =>
      apiFetch<GitHubAvailableRepository[]>(
        `/projects/${projectId}/github/repositories/available`,
      ),
    enabled:
      canManage && Boolean(settingsQuery.data?.installation?.isActive),
  });
  const startInstallation = useMutation({
    mutationFn: () =>
      apiFetch<{ url: string }>(`/projects/${projectId}/github/install`, {
        method: "POST",
      }),
    onSuccess: ({ url }) => window.location.assign(url),
  });
  const addRepository = useMutation({
    mutationFn: (fullName: string) =>
      apiFetch<GitHubRepository>(`/projects/${projectId}/github/repositories`, {
        method: "POST",
        body: JSON.stringify({ fullName }),
      }),
    onSuccess: async () => {
      setSelectedRepository("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["github-project", projectId] }),
        queryClient.invalidateQueries({
          queryKey: ["github-available-repositories", projectId],
        }),
      ]);
    },
  });
  const updateSettings = useMutation({
    mutationFn: (autoCompleteOnMerge: boolean) =>
      apiFetch<{ autoCompleteOnMerge: boolean }>(
        `/projects/${projectId}/github/settings`,
        {
          method: "PATCH",
          body: JSON.stringify({ autoCompleteOnMerge }),
        },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["github-project", projectId] }),
  });

  const error =
    settingsQuery.error ??
    availableRepositoriesQuery.error ??
    startInstallation.error ??
    addRepository.error ??
    updateSettings.error;
  const integration = settingsQuery.data;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-foreground">GitHub integration</h2>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {error ? (
          <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger-foreground" role="alert">
            {getErrorMessage(error)}
          </p>
        ) : null}
        {settingsQuery.isLoading ? (
          <p className="text-xs text-muted">Loading GitHub settings…</p>
        ) : !integration?.configured ? (
          <p className="text-xs leading-5 text-muted">
            GitHub App credentials have not been configured on this server.
          </p>
        ) : !integration.installation?.isActive ? (
          <div className="space-y-3">
            <p className="text-xs leading-5 text-muted">
              Install the TaskFlow GitHub App to connect a repository and show linked issues and pull requests here.
            </p>
            {canManage ? (
              <Button
                disabled={startInstallation.isPending}
                onClick={() => startInstallation.mutate()}
                size="sm"
              >
                {startInstallation.isPending
                  ? "Opening GitHub…"
                  : "Connect GitHub"}
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-xs text-muted">
              Installed for <span className="font-medium text-foreground">@{integration.installation.accountLogin}</span>
            </p>
            {integration.installation.repositories.length ? (
              <ul className="space-y-1">
                {integration.installation.repositories.map((repository) => (
                  <li
                    className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2 text-xs text-foreground"
                    key={repository.id}
                  >
                    <span>{repository.fullName}</span>
                    <span className="text-muted">{repository.defaultBranch}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">No repositories connected yet.</p>
            )}
            {canManage ? (
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (selectedRepository) addRepository.mutate(selectedRepository);
                }}
              >
                <select
                  aria-label="Select a GitHub repository"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-brand"
                  disabled={
                    availableRepositoriesQuery.isLoading ||
                    !availableRepositoriesQuery.data?.length
                  }
                  onChange={(event) => setSelectedRepository(event.target.value)}
                  value={selectedRepository}
                >
                  <option value="">
                    {availableRepositoriesQuery.isLoading
                      ? "Loading repositories…"
                      : "Choose repository"}
                  </option>
                  {availableRepositoriesQuery.data?.map((repository) => (
                    <option key={repository.githubRepoId} value={repository.fullName}>
                      {repository.fullName}
                    </option>
                  ))}
                </select>
                <Button
                  disabled={!selectedRepository || addRepository.isPending}
                  size="sm"
                  type="submit"
                >
                  {addRepository.isPending ? "Adding…" : "Add"}
                </Button>
              </form>
            ) : null}
            {canManage ? (
              <label className="flex items-start gap-2 border-t border-border pt-3 text-xs leading-5 text-muted">
                <input
                  checked={integration.autoCompleteOnMerge}
                  className="mt-1 accent-brand"
                  disabled={updateSettings.isPending}
                  onChange={(event) =>
                    updateSettings.mutate(event.target.checked)
                  }
                  type="checkbox"
                />
                Move linked tasks to Done when a pull request is merged
              </label>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
