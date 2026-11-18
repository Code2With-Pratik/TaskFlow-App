export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`taskflow-mark ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}
