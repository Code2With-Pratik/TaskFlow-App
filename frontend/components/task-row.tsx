import Link from "next/link";
import { CalendarDays, MessageSquare } from "@/components/animated-icons";
import { IconHover } from "@/components/icon-hover";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { Task } from "@/types/api";

export function TaskRow({ task }: { task: Task }) {
  return (
    <IconHover>
      <Link
        href={`/tasks/${task.id}`}
        className="group flex items-center justify-between gap-2 rounded-xl px-2 py-3 transition-colors hover:bg-surface-secondary sm:gap-4 sm:px-3"
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface text-muted">
            <span
              className={`size-2 rounded-full ${
                task.status === "DONE"
                  ? "bg-success"
                  : task.status === "IN_PROGRESS"
                    ? "bg-warning"
                    : "bg-danger"
              }`}
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-foreground group-hover:text-brand">
              {task.title}
            </span>
            <span className="mt-1 block truncate text-xs text-muted">
              {task.project.name}
            </span>
          </span>
        </div>
        <span className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-x-1.5 gap-y-1 sm:gap-x-3">
          <span className="hidden items-center gap-1 text-xs text-muted sm:flex">
            <CalendarDays size={13} />
            {formatDate(task.dueDate)}
          </span>
          {task._count ? (
            <span className="hidden items-center gap-1 text-xs text-muted md:flex">
              <MessageSquare size={13} />
              {task._count.comments}
            </span>
          ) : null}
          <Badge className="px-2 text-[10px] sm:text-[11px]">{task.status}</Badge>
          <Badge className="px-2 text-[10px] sm:text-[11px]">{task.priority}</Badge>
          {task.assignees.length ? (
            <span className="flex -space-x-2">
              {task.assignees.map((assignee) => (
                <UserAvatar
                  key={assignee.id}
                  className="size-7 border-2 border-surface"
                  title={assignee.name}
                  name={assignee.name}
                  avatar={assignee.avatar}
                />
              ))}
            </span>
          ) : null}
        </span>
      </Link>
    </IconHover>
  );
}
