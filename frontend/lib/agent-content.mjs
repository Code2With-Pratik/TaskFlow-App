export const homepageMarkdown = `# TaskFlow by Pratik Dhandare

TaskFlow is project and task management software for teams that want a clear way to plan projects, organize tasks, and follow progress. Built by Pratik Dhandare (Code2WithPratik), TaskFlow brings project conversations, assignments, and delivery status into one focused workspace.

## Plan projects and coordinate work

Create projects, define priorities, and use project boards to understand what is active. Assign tasks to teammates, set due dates, update status, and keep decisions close to the work with comments and mentions. A shared dashboard and notifications help teams see deadlines, invitations, and the next actions that need attention.

## Connect engineering work

Optional GitHub App integration links repositories, issues, and pull requests with project tasks. TaskFlow is a web application with a Next.js frontend and a NestJS HTTP API. Project membership and role-aware access help teams collaborate while keeping workspace data scoped to its members.

## Get started and learn more

- [Create a TaskFlow account](/register)
- [Sign in to TaskFlow](/login)
- [TaskFlow developer resources](/llms.txt)
- [TaskFlow source code](https://github.com/Code2With-Pratik/TaskFlow-App)
- [Developer resources](https://github.com/Code2With-Pratik/TaskFlow-App/tree/main/backend)
- [GitHub: Code2With-Pratik](https://github.com/Code2With-Pratik)
`;

export const notFoundMarkdown = `# Page not found

The requested TaskFlow page does not exist. Check the address or visit the [TaskFlow documentation](/llms.txt) for product and developer resources.
`;

export function acceptsMarkdown(acceptHeader) {
  if (!acceptHeader) return false;

  return acceptHeader.split(",").some((mediaRange) => {
    const [mediaType, ...parameters] = mediaRange.trim().split(";");
    if (mediaType.toLowerCase() !== "text/markdown") return false;

    const quality = parameters.find((parameter) => /^\s*q=/i.test(parameter));
    return quality === undefined || Number(quality.split("=")[1]) > 0;
  });
}

export function isKnownAppPath(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const staticPaths = new Set([
    "/",
    "/login",
    "/register",
    "/dashboard",
    "/notifications",
    "/profile",
    "/projects",
    "/tasks",
    "/settings",
    "/llms.txt",
    "/robots.txt",
    "/sitemap.xml",
  ]);

  return (
    staticPaths.has(path) ||
    /^\/projects\/[^/]+(?:\/board)?$/.test(path) ||
    /^\/tasks\/[^/]+$/.test(path)
  );
}
