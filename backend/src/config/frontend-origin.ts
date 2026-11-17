const wildcardMarker = 'taskflow-preview-wildcard';

export function normalizeFrontendOrigin(value: string): string {
  const parsed = new URL(value.replace('*', wildcardMarker));
  if (!value.includes('*')) return parsed.origin;

  return `${parsed.protocol}//${parsed.host.replace(wildcardMarker, '*')}`;
}

export function isAllowedFrontendOrigin(
  origin: string,
  allowedOrigins: string[],
): boolean {
  return allowedOrigins.some((allowedOrigin) => {
    if (!allowedOrigin.includes('*')) return origin === allowedOrigin;

    const pattern = allowedOrigin
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace('\\*', '[a-z0-9-]+');
    return new RegExp(`^${pattern}$`, 'i').test(origin);
  });
}
