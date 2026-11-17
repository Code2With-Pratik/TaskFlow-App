"use client";

import {
  Bell,
  Check,
  CheckCheck,
  FolderPlus,
  MessageSquareText,
  Clock3,
  TriangleAlert,
  UserRoundPlus,
} from "@/components/animated-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "@/components/query-state";
import { IconHover } from "@/components/icon-hover";
import { MentionedText } from "@/components/mentioned-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { useAuth } from "@/app/auth-provider";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Notification, NotificationList, NotificationType } from "@/types/api";

const icons: Record<NotificationType, typeof Bell> = {
  TASK_ASSIGNED: UserRoundPlus,
  TASK_STATUS_UPDATED: Check,
  COMMENT_ADDED: MessageSquareText,
  COMMENT_MENTIONED: MessageSquareText,
  PROJECT_INVITATION: FolderPlus,
  TASK_DUE_SOON: Clock3,
  TASK_OVERDUE: TriangleAlert,
  GITHUB_PULL_REQUEST_MERGED: Check,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<NotificationList>("/notifications"),
    refetchInterval: 60_000,
  });
  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAllRead = useMutation({
    mutationFn: () => apiFetch<void>("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const respondToInvitation = useMutation({
    mutationFn: ({
      invitationId,
      response,
    }: {
      invitationId: string;
      response: "accept" | "decline";
    }) =>
      apiFetch<{ projectId: string; accepted: boolean }>(
        `/projects/invitations/${invitationId}/${response}`,
        { method: "POST" },
      ),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      if (result.accepted) router.push(`/projects/${result.projectId}`);
    },
  });

  if (query.isLoading) return <LoadingState label="Loading notifications…" />;
  if (query.error) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <ErrorState error={new Error("Notification data is missing.")} onRetry={() => void query.refetch()} />;

  return (
    <div>
      <PageHeading
        eyebrow="Inbox"
        title="Notifications"
        description="Important updates from the projects you work on."
        action={
          query.data.unreadCount > 0 ? (
            <Button
              variant="secondary"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck size={15} />
              {markAllRead.isPending ? "Updating…" : "Mark all read"}
            </Button>
          ) : null
        }
      />
      {markRead.error || markAllRead.error ? (
        <p className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger-foreground" role="alert">
          {getErrorMessage(markRead.error ?? markAllRead.error)}
        </p>
      ) : null}
      {respondToInvitation.error ? (
        <p className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger-foreground" role="alert">
          {getErrorMessage(respondToInvitation.error)}
        </p>
      ) : null}
      <Card>
        <CardContent className="p-3 sm:p-5">
          {query.data.data.length ? (
            <div className="divide-y divide-border">
              {query.data.data.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  userName={user?.name}
                  isPending={markRead.isPending || respondToInvitation.isPending}
                  onMarkRead={() => markRead.mutate(notification.id)}
                  onAccept={() =>
                    notification.projectInvitation &&
                    respondToInvitation.mutate({
                      invitationId: notification.projectInvitation.id,
                      response: "accept",
                    })
                  }
                  onDecline={() =>
                    notification.projectInvitation &&
                    respondToInvitation.mutate({
                      invitationId: notification.projectInvitation.id,
                      response: "decline",
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="You’re all caught up"
              description="When something needs your attention, you’ll find it here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationRow({
  notification,
  userName,
  isPending,
  onMarkRead,
  onAccept,
  onDecline,
}: {
  notification: Notification;
  userName?: string;
  isPending: boolean;
  onMarkRead: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const Icon = icons[notification.type];
  const pendingInvitation =
    notification.projectInvitation?.status === "PENDING" &&
    notification.type === "PROJECT_INVITATION";
  const notificationHref =
    notification.type !== "PROJECT_INVITATION" ||
    notification.projectInvitation?.status === "ACCEPTED"
      ? notification.href
      : null;
  return (
    <IconHover>
      <article
        className={`flex gap-3 rounded-xl px-3 py-4 sm:gap-4 ${
          notification.isRead ? "" : "bg-brand/[0.035]"
        }`}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-secondary text-muted">
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              {notificationHref && !pendingInvitation ? (
                <Link
                  className="hover:text-brand"
                  href={notificationHref}
                  onClick={onMarkRead}
                >
                  {notification.title}
                </Link>
              ) : notification.title}
            </h2>
            {!notification.isRead ? <Badge>New</Badge> : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-muted">
            <MentionedText
              names={
                notification.type === "COMMENT_MENTIONED" && userName
                  ? [userName]
                  : []
              }
              text={notification.message}
            />
          </p>
          {pendingInvitation ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                disabled={isPending}
                onClick={onAccept}
                className="hover:opacity-90 active:opacity-80"
                style={{
                  backgroundColor: "var(--invitation-accept-background)",
                  color: "var(--invitation-accept-foreground)",
                }}
                size="sm"
              >
                Accept
              </Button>
              <Button
                disabled={isPending}
                onClick={onDecline}
                size="sm"
                variant="danger"
              >
                Decline
              </Button>
              <span className="text-xs text-muted">
                {notification.projectInvitation?.project.name} · invited by{" "}
                {notification.projectInvitation?.inviter.name}
              </span>
            </div>
          ) : null}
          <p className="mt-1.5 text-xs text-muted">
            {formatDate(notification.createdAt, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        {!notification.isRead ? (
          <button
            aria-label={`Mark ${notification.title} as read`}
            className="grid size-8 shrink-0 place-items-center self-center rounded-lg text-muted hover:bg-surface-secondary hover:text-brand"
            disabled={isPending}
            onClick={onMarkRead}
            type="button"
          >
            <Check size={16} />
          </button>
        ) : null}
      </article>
    </IconHover>
  );
}
