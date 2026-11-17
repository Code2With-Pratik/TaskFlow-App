import { siteUrl } from "../../lib/site";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
const apiDocsUrl = apiBaseUrl
  ? `${apiBaseUrl}/api/docs`
  : "https://github.com/Code2With-Pratik/TaskFlow-App/tree/main/backend";

export function GET(): Response {
  const content = `# TaskFlow

> TaskFlow by Pratik Dhandare (Code2WithPratik) is project and task management software for teams.

TaskFlow helps teams plan projects, assign and track tasks, coordinate through comments and notifications, and connect engineering work to GitHub issues and pull requests.

## Product

- [TaskFlow homepage](${siteUrl}/): Project and task management software
- [Create an account](${siteUrl}/register)
- [Sign in](${siteUrl}/login)

## Developer documentation

- [TaskFlow API reference](${apiDocsUrl}): NestJS HTTP API documentation
- [TaskFlow source code](https://github.com/Code2With-Pratik/TaskFlow-App)
- [Backend source and API overview](https://github.com/Code2With-Pratik/TaskFlow-App/tree/main/backend)
- [Code2With-Pratik on GitHub](https://github.com/Code2With-Pratik)
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
