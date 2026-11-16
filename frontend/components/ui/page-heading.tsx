export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4 sm:items-end">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="break-words text-2xl font-semibold tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="max-w-full">{action}</div> : null}
    </div>
  );
}
