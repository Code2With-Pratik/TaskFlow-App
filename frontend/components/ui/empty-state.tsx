import type { AnimatedIcon } from "@/components/animated-icons";
import { IconHover } from "@/components/icon-hover";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: AnimatedIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <IconHover>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-surface-secondary text-muted">
          <Icon size={20} strokeWidth={1.8} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted">
          {description}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </IconHover>
  );
}
