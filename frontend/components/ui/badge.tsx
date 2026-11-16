import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeColors: Record<string, string> = {
  TODO: "bg-danger/10 text-danger-foreground",
  IN_PROGRESS: "bg-warning/10 text-warning",
  DONE: "bg-success/10 text-success",
  LOW: "bg-surface-secondary text-muted",
  MEDIUM: "bg-surface-secondary text-foreground",
  HIGH: "bg-surface-secondary text-foreground",
  OWNER: "bg-brand/10 text-brand",
  ADMIN: "bg-surface-secondary text-foreground",
  MEMBER: "bg-surface-secondary text-muted",
};

const badgeLabels: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export function Badge({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  const key = typeof children === "string" ? children : "";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        badgeColors[key] ?? "bg-surface-secondary text-muted",
        className,
      )}
      {...props}
    >
      {badgeLabels[key] ?? children}
    </span>
  );
}
