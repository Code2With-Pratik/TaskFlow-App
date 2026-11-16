"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";

const pollIntervalMs = 4_000;
const wakeUpTimeoutMs = 90_000;

export type BackendHealthStatus = "checking" | "ready" | "error" | "timeout";

export function useBackendHealth() {
  const [status, setStatus] = useState<BackendHealthStatus>("checking");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let finished = false;
    let requestController: AbortController | null = null;
    let pollTimer: number | undefined;
    const deadline = Date.now() + wakeUpTimeoutMs;

    const deadlineTimer = window.setTimeout(() => {
      if (!active || finished) return;
      finished = true;
      requestController?.abort();
      if (pollTimer) window.clearTimeout(pollTimer);
      setStatus("timeout");
      setError(
        (current) =>
          current ?? "The backend did not respond within 90 seconds.",
      );
    }, wakeUpTimeoutMs);

    async function checkHealth() {
      if (!active || finished) return;
      requestController = new AbortController();

      try {
        const response = await fetch(`${getApiBaseUrl()}/health`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: requestController.signal,
        });
        if (!response.ok) {
          throw new Error(`Health check returned HTTP ${response.status}.`);
        }

        let body: unknown;
        try {
          body = await response.json();
        } catch {
          throw new Error("The backend returned an invalid health response.");
        }

        if (
          typeof body !== "object" ||
          body === null ||
          !("status" in body) ||
          body.status !== "ok"
        ) {
          throw new Error("The backend returned an unexpected health response.");
        }

        if (!active || finished) return;
        finished = true;
        window.clearTimeout(deadlineTimer);
        setStatus("ready");
        setError(null);
      } catch (healthError) {
        if (!active || finished) return;
        setStatus("error");
        setError(
          healthError instanceof Error
            ? healthError.message
            : "Could not connect to the backend.",
        );
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          finished = true;
          window.clearTimeout(deadlineTimer);
          setStatus("timeout");
          return;
        }
        pollTimer = window.setTimeout(
          () => void checkHealth(),
          Math.min(pollIntervalMs, remaining),
        );
      }
    }

    void checkHealth();

    return () => {
      active = false;
      finished = true;
      window.clearTimeout(deadlineTimer);
      if (pollTimer) window.clearTimeout(pollTimer);
      requestController?.abort();
    };
  }, [attempt]);

  const retryConnection = useCallback(() => {
    setStatus("checking");
    setError(null);
    setAttempt((current) => current + 1);
  }, []);

  return {
    status,
    error,
    isReady: status === "ready",
    retryConnection,
  };
}
