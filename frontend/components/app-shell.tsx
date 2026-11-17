"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Clock3,
  FolderPlus,
  MessageSquareText,
  Menu,
  Moon,
  Sun,
  TriangleAlert,
  UserRoundPlus,
  X,
  type AnimatedIcon,
} from "@/components/animated-icons";
import { IconHover } from "@/components/icon-hover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/app/auth-provider";
import { useTheme } from "@/app/theme-provider";
import {
  apiFetch,
  getAccessToken,
  getApiBaseUrl,
  getErrorMessage,
  refreshSession,
} from "@/lib/api";
import type {
  Notification,
  NotificationList,
  NotificationType,
} from "@/types/api";

const notificationIcons: Record<NotificationType, AnimatedIcon> = {
  TASK_ASSIGNED: UserRoundPlus,
  TASK_STATUS_UPDATED: Check,
  COMMENT_ADDED: MessageSquareText,
  PROJECT_INVITATION: FolderPlus,
  TASK_DUE_SOON: Clock3,
  TASK_OVERDUE: TriangleAlert,
};

const notificationPreviewLimit = 5;
const notificationMessageLimit = 150;

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/projects": "Projects",
  "/tasks": "My tasks",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/settings": "Settings",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [realtimeUnavailable, setRealtimeUnavailable] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(
    () => new Set(),
  );
  const notificationAreaRef = useRef<HTMLDivElement>(null);
  const notificationPopoverRef = useRef<HTMLElement>(null);
  const notificationTriggerRef = useRef<HTMLButtonElement>(null);
  const profileAreaRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<NotificationList>("/notifications"),
    refetchInterval: 60_000,
  });
  const notifications = notificationsQuery.data;
  const markNotificationRead = useMutation<
    void,
    Error,
    string,
    { previous: NotificationList | undefined }
  >({
    mutationFn: (id) =>
      apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH" }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<NotificationList>([
        "notifications",
      ]);
      if (previous) {
        queryClient.setQueryData<NotificationList>(["notifications"], {
          ...previous,
          data: previous.data.map((notification) =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification,
          ),
          unreadCount: Math.max(
            0,
            previous.unreadCount -
              (previous.data.some(
                (notification) => notification.id === id && !notification.isRead,
              )
                ? 1
                : 0),
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const title =
    pageTitles[pathname] ??
    (pathname.includes("/board") ? "Project board" : "Project");

  useEffect(() => {
    if (!notificationOpen && !profileOpen) return;

    function dismissOutside(event: PointerEvent | FocusEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        notificationOpen &&
        !notificationAreaRef.current?.contains(target) &&
        !notificationPopoverRef.current?.contains(target)
      ) {
        setNotificationOpen(false);
      }
      if (profileOpen && !profileAreaRef.current?.contains(target)) {
        setProfileOpen(false);
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (notificationOpen) {
        setNotificationOpen(false);
        notificationTriggerRef.current?.focus();
      } else if (profileOpen) {
        setProfileOpen(false);
        profileTriggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [notificationOpen, profileOpen]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    let socket: ReturnType<typeof io> | null = null;

    async function connect() {
      let token = getAccessToken();
      if (!token) {
        try {
          const session = await refreshSession();
          token = session?.accessToken ?? null;
        } catch {
          if (active) setRealtimeUnavailable(true);
          return;
        }
      }
      if (!active) return;
      if (!token) {
        setRealtimeUnavailable(true);
        return;
      }

      socket = io(`${getApiBaseUrl()}/notifications`, {
        auth: { token },
        withCredentials: true,
      });
      socket.on("connect", () => setRealtimeUnavailable(false));
      socket.on("connect_error", () => setRealtimeUnavailable(true));
      socket.on("notification:new", () => {
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        void queryClient.invalidateQueries({ queryKey: ["tasks"] });
        void queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
        void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        void queryClient.invalidateQueries({ queryKey: ["project-activities"] });
      });
      socket.on("disconnect", (reason) => {
        setRealtimeUnavailable(true);
        if (reason === "io server disconnect") {
          void refreshSession()
            .then((session) => {
              if (!active || !session || !socket) return;
              socket.auth = { token: session.accessToken };
              socket.connect();
            })
            .catch(() => {
              if (active) setRealtimeUnavailable(true);
            });
        }
      });
    }

    void connect();
    return () => {
      active = false;
      socket?.disconnect();
    };
  }, [queryClient, user]);

  async function handleSignOut() {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      setSignOutError(getErrorMessage(error));
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <div className="fixed inset-y-0 left-0 z-20 hidden lg:block">
        <AppSidebar />
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 flex h-dvh lg:hidden">
          <button
            className="absolute inset-0 bg-black/55"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 h-full max-h-dvh shadow-2xl">
            <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
            <Button
              className="absolute right-3 top-4"
              size="icon"
              variant="ghost"
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={18} />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="min-h-screen lg:pl-[252px]">
        <header className="glass-header sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-border px-4 sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              className="lg:hidden"
              size="icon"
              variant="ghost"
              aria-label="Open navigation"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={19} />
            </Button>
            <div className="truncate">
              <p className="text-[11px] text-muted">Workspace</p>
              <p className="text-sm font-semibold text-foreground">{title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
            <div className="relative" ref={notificationAreaRef}>
              <Button
                ref={notificationTriggerRef}
                size="icon"
                variant="ghost"
                aria-label={
                  notifications?.unreadCount
                    ? `Notifications, ${notifications.unreadCount} unread`
                    : "Notifications"
                }
                aria-haspopup="dialog"
                aria-expanded={notificationOpen}
                aria-controls={
                  notificationOpen ? "notification-preview" : undefined
                }
                onClick={() => {
                  setNotificationOpen((open) => !open);
                  setProfileOpen(false);
                }}
              >
                <Bell size={18} strokeWidth={1.8} />
                {notifications?.unreadCount ? (
                  <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-surface bg-danger-action" />
                ) : null}
              </Button>
              {notificationOpen && typeof document !== "undefined"
                ? createPortal(
                    <section
                      ref={notificationPopoverRef}
                      id="notification-preview"
                      aria-labelledby="notification-preview-title"
                      aria-busy={notificationsQuery.isLoading || markNotificationRead.isPending}
                      className="glass-panel notification-popover fixed z-40 flex flex-col overflow-hidden rounded-2xl border border-glass-edge shadow-2xl shadow-black/20"
                      style={{
                        position: "fixed",
                        top: "calc(4.25rem + env(safe-area-inset-top, 0px))",
                        right: "max(0.75rem, env(safe-area-inset-right, 0px))",
                        width: "min(24rem, calc(100vw - 1.5rem))",
                      }}
                      role="dialog"
                    >
                  <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
                    <div className="min-w-0">
                      <h2
                        id="notification-preview-title"
                        className="text-sm font-semibold text-foreground"
                      >
                        Notifications
                      </h2>
                      <p className="mt-0.5 text-xs text-muted" role="status" aria-live="polite">
                        {notifications?.unreadCount
                          ? `${notifications.unreadCount} unread`
                          : "You’re all caught up"}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-10"
                      aria-label="Close notifications"
                      onClick={() => {
                        setNotificationOpen(false);
                        notificationTriggerRef.current?.focus();
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </div>

                  {markNotificationRead.error ? (
                    <p className="mx-3 mt-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger-foreground" role="alert">
                      {getErrorMessage(markNotificationRead.error)}
                    </p>
                  ) : null}

                  <div
                    className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto p-2"
                    role="region"
                    aria-label="Recent notifications"
                    tabIndex={0}
                  >
                    {notificationsQuery.isLoading ? (
                      <p className="px-3 py-8 text-center text-sm text-muted" role="status">
                        Loading notifications…
                      </p>
                    ) : notificationsQuery.error ? (
                      <div className="px-3 py-7 text-center">
                        <p className="text-sm text-foreground">
                          Could not load notifications.
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {getErrorMessage(notificationsQuery.error)}
                        </p>
                        <Button
                          className="mt-3"
                          size="sm"
                          variant="secondary"
                          onClick={() => void notificationsQuery.refetch()}
                        >
                          Try again
                        </Button>
                      </div>
                    ) : notifications?.data.length ? (
                      <div className="divide-y divide-border">
                        {notifications.data
                          .slice(0, notificationPreviewLimit)
                          .map((notification) => (
                            <NotificationPreviewRow
                              key={notification.id}
                              notification={notification}
                              expanded={expandedNotifications.has(notification.id)}
                              isPending={
                                markNotificationRead.isPending &&
                                markNotificationRead.variables === notification.id
                              }
                              onActivate={() => {
                                if (
                                  !notification.isRead &&
                                  !markNotificationRead.isPending
                                ) {
                                  markNotificationRead.mutate(notification.id);
                                }
                                setNotificationOpen(false);
                              }}
                              onToggleExpanded={() =>
                                setExpandedNotifications((current) => {
                                  const next = new Set(current);
                                  if (next.has(notification.id)) {
                                    next.delete(notification.id);
                                  } else {
                                    next.add(notification.id);
                                  }
                                  return next;
                                })
                              }
                            />
                          ))}
                      </div>
                    ) : (
                      <p className="px-3 py-8 text-center text-sm text-muted">
                        No notifications yet. Updates from your projects will appear here.
                      </p>
                    )}
                  </div>

                  <div className="border-t border-border p-2">
                    <Link
                      className="block rounded-xl px-3 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary focus-visible:outline"
                      href="/notifications"
                      onClick={() => setNotificationOpen(false)}
                    >
                      View all notifications
                    </Link>
                  </div>
                    </section>,
                    document.body,
                  )
                : null}
            </div>

            <div className="relative ml-1" ref={profileAreaRef}>
              <button
                ref={profileTriggerRef}
                type="button"
                className="glass-interactive flex items-center gap-2 rounded-xl p-1.5 hover:bg-surface-secondary"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-controls={profileOpen ? "profile-menu" : undefined}
                aria-label={`${user?.name ?? "Profile"} menu`}
                onClick={() => {
                  setProfileOpen((open) => !open);
                  setNotificationOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    setProfileOpen(true);
                    requestAnimationFrame(() => {
                      const items =
                        profileAreaRef.current?.querySelectorAll<HTMLElement>(
                          '[role="menuitem"]',
                        );
                      if (event.key === "ArrowUp") items?.[items.length - 1]?.focus();
                      else items?.[0]?.focus();
                    });
                  }
                }}
              >
                <UserAvatar
                  name={user?.name ?? "TaskFlow"}
                  avatar={user?.avatar ?? null}
                  className="size-8 text-xs"
                />
                <span className="hidden max-w-32 text-left sm:block">
                  <span className="block truncate text-xs font-semibold text-foreground">
                    {user?.name}
                  </span>
                  {user?.designation ? (
                    <span className="block truncate text-[10px] text-muted">
                      {user.designation}
                    </span>
                  ) : null}
                </span>
              </button>
              {profileOpen ? (
                <div
                  id="profile-menu"
                  className="glass-panel absolute right-0 mt-2 w-36 rounded-2xl border border-glass-edge p-1.5 shadow-xl"
                  role="menu"
                  aria-label="Profile"
                  onKeyDown={(event) => {
                    if (event.key === "Tab") {
                      setProfileOpen(false);
                      return;
                    }
                    if (
                      !["ArrowDown", "ArrowUp", "Home", "End"].includes(
                        event.key,
                      )
                    ) {
                      return;
                    }
                    event.preventDefault();
                    const items = Array.from(
                      event.currentTarget.querySelectorAll<HTMLElement>(
                        '[role="menuitem"]',
                      ),
                    );
                    const currentIndex = items.indexOf(
                      document.activeElement as HTMLElement,
                    );
                    const nextIndex =
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? items.length - 1
                          : (currentIndex +
                              (event.key === "ArrowDown" ? 1 : -1) +
                              items.length) %
                            items.length;
                    items[nextIndex]?.focus();
                  }}
                >
                  <Link
                    role="menuitem"
                    tabIndex={-1}
                    className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-surface-secondary focus-visible:outline"
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                  >
                    Your profile
                  </Link>
                  <Link
                    role="menuitem"
                    tabIndex={-1}
                    className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-surface-secondary focus-visible:outline"
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    role="menuitem"
                    tabIndex={-1}
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-danger-foreground hover:bg-surface-secondary"
                    disabled={isSigningOut}
                    onClick={() => {
                      setProfileOpen(false);
                      void handleSignOut();
                    }}
                  >
                    {isSigningOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        {realtimeUnavailable ? (
          <p
            className="border-b border-warning/20 bg-warning/5 px-4 py-2 text-center text-xs text-warning"
            role="status"
          >
            Live updates are unavailable. The inbox will refresh automatically.
          </p>
        ) : null}
        <main className="mx-auto w-full max-w-[1440px] min-w-0 px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
          {signOutError ? (
            <p
              className="mb-5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger-foreground"
              role="alert"
            >
              Could not sign out: {signOutError}
            </p>
          ) : null}
          {markNotificationRead.error ? (
            <p
              className="mb-5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger-foreground"
              role="alert"
            >
              Could not mark notification as read:{" "}
              {getErrorMessage(markNotificationRead.error)}
            </p>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}

function NotificationPreviewRow({
  notification,
  expanded,
  isPending,
  onActivate,
  onToggleExpanded,
}: {
  notification: Notification;
  expanded: boolean;
  isPending: boolean;
  onActivate: () => void;
  onToggleExpanded: () => void;
}) {
  const Icon = notificationIcons[notification.type];
  const isLong = notification.message.length > notificationMessageLimit;
  const notificationContent = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold leading-5 text-foreground">
          {notification.title}
        </span>
        {!notification.isRead ? (
          <span
            className="mt-1 size-2 shrink-0 rounded-full bg-danger-action"
            aria-hidden="true"
          />
        ) : null}
      </span>
      <span
        className={`mt-0.5 block text-xs leading-5 text-muted ${
          isLong && !expanded ? "line-clamp-2" : ""
        }`}
      >
        {notification.message}
      </span>
      <span className="mt-1.5 block text-[10px] text-muted">
        {formatDate(notification.createdAt, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
        {isPending ? " · Marking as read…" : null}
      </span>
    </>
  );

  return (
    <IconHover>
      <article
        className={`flex gap-2 rounded-xl px-2 py-3 ${
          notification.isRead ? "" : "bg-brand/[0.035]"
        }`}
      >
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-surface-secondary text-muted">
          <Icon size={15} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href="/notifications"
            className="glass-interactive block w-full rounded-md py-0.5 text-left focus-visible:outline"
            aria-label={`Open notifications: ${notification.title}`}
            onClick={onActivate}
          >
            {notificationContent}
          </Link>
          {isLong ? (
            <button
              type="button"
              className="glass-interactive mt-1 rounded px-1 py-0.5 text-xs font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground focus-visible:outline"
              aria-expanded={expanded}
              onClick={onToggleExpanded}
            >
              Read {expanded ? "less" : "more"}
            </button>
          ) : null}
        </div>
      </article>
    </IconHover>
  );
}
