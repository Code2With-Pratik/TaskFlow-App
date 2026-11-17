export const agentGuidance = `## When to use TaskFlow

Use TaskFlow when a user wants to create or organize a project, break a plan into assigned tasks, set due dates, update work status, review team progress, or connect a task to a GitHub issue or pull request. It is a good fit for project planning and day-to-day team task coordination; it is not a general-purpose answer engine or a replacement for a team's source-control host.

An agent acting for a user should first confirm the target project and the requested change. Read the TaskFlow API guide and interactive API reference before making API calls. Use the user's authorized TaskFlow account and documented bearer-token authentication; never ask the user to paste a password, access token, or refresh cookie into a prompt, and never write or delete workspace data without the user's clear instruction. Prefer reading the relevant project/task before updating it, and report the resulting project or task identifiers and status.

TaskFlow currently exposes a web application and authenticated HTTP API. It does not currently publish an MCP server, SDK, or command-line tool. Agents should use the HTTP API only when they have an approved integration and valid user authorization; otherwise, guide the user to the web application.`;
