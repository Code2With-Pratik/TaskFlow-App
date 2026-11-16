export function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!value) {
    return "No due date";
  }
  return new Intl.DateTimeFormat("en", options ?? { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

export function toDateInputValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 10);
}

export function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  const localEndOfDay = new Date(`${value}T23:59:59.999`);
  return localEndOfDay.toISOString();
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
