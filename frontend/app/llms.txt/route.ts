import { siteUrl } from "../../lib/site";
import { apiDocsUrl } from "../../lib/api-docs";
import { agentGuidance } from "../../lib/agent-guidance.mjs";

export function GET(): Response {
  const content = `# TaskFlow

> TaskFlow by Pratik Dhandare (Code2WithPratik) is project and task management software for teams.

TaskFlow is project and task management software. It helps teams plan projects, assign and track tasks, coordinate through comments and notifications, and connect engineering work to GitHub issues and pull requests.

${agentGuidance.replaceAll(
    "TaskFlow API guide",
    `[TaskFlow API guide](${siteUrl}/developers/api)`,
  ).replaceAll(
    "interactive API reference",
    `[interactive API reference](${apiDocsUrl})`,
  )}

## Product

- [TaskFlow homepage](${siteUrl}/): Project and task management software
- [Create an account](${siteUrl}/register)
- [Sign in](${siteUrl}/login)
- [About TaskFlow](${siteUrl}/about)
- [Contact TaskFlow](${siteUrl}/contact)
- [TaskFlow Privacy](${siteUrl}/privacy)

## Developer documentation

- [TaskFlow API documentation](${siteUrl}/developers/api): First-party guide for the project and task management API
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
