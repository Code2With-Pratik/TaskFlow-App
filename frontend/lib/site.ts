export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://task-flow-app-black.vercel.app"
).replace(/\/+$/, "");
