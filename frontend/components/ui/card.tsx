import type { HTMLAttributes } from "react";
import { IconHover } from "@/components/icon-hover";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <IconHover>
      <div
        className={cn(
          "glass-card rounded-2xl border border-border shadow-sm shadow-slate-950/[0.025]",
          className,
        )}
        {...props}
      />
    </IconHover>
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-0", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
