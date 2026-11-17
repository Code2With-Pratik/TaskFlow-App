import { useId } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { Task } from "@/types/api";

type Assignee = Task["assignees"][number];

export function AssigneeAvatar({ user }: { user: Assignee }) {
  const tooltipId = useId();

  return (
    <span
      aria-describedby={tooltipId}
      aria-label={`${user.name}${user.designation ? `, ${user.designation}` : ""}, ${user.email}`}
      className="group/assignee relative inline-flex focus:z-20 hover:z-20"
      tabIndex={0}
    >
      <UserAvatar
        className="size-7 border-2 border-surface"
        name={user.name}
        avatar={user.avatar}
      />
      <span
        id={tooltipId}
        className="pointer-events-none absolute bottom-[calc(100%+0.65rem)] left-1/2 z-40 w-56 -translate-x-1/2 translate-y-1 rounded-xl border border-border/80 bg-surface px-3 py-2.5 text-left opacity-0 shadow-xl shadow-black/15 transition-all duration-200 ease-out group-hover/assignee:translate-y-0 group-hover/assignee:opacity-100 group-focus-within/assignee:translate-y-0 group-focus-within/assignee:opacity-100"
        role="tooltip"
      >
        <span className="block truncate text-xs font-semibold text-foreground">
          {user.name}
        </span>
        {user.designation ? (
          <span className="mt-0.5 block truncate text-[11px] text-muted">
            {user.designation}
          </span>
        ) : null}
        <span className="mt-1 block truncate text-[11px] text-muted">
          {user.email}
        </span>
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-b border-r border-border/80 bg-surface"
        />
      </span>
    </span>
  );
}
