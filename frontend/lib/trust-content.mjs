export const aboutContent = {
  title: "About TaskFlow",
  intro:
    "TaskFlow is a web-based project and task management application for teams that need a shared place to plan work, coordinate responsibilities, and track progress.",
  sections: [
    {
      heading: "What TaskFlow helps teams do",
      paragraphs: [
        "Teams can create projects, organize work into tasks, assign teammates, set due dates, and follow status changes. Project activity, comments, mentions, dashboards, and notifications keep work and its context connected. Optional GitHub App integration links repository issues and pull requests with project tasks.",
        "TaskFlow is intended for practical project planning and task coordination. It is not a project management consultancy, and the product does not promise a particular delivery outcome. Teams remain responsible for their plans, access decisions, and the information they add to a workspace.",
      ],
    },
    {
      heading: "Who builds TaskFlow",
      paragraphs: [
        "TaskFlow is built by Pratik Dhandare, who also publishes projects as Code2WithPratik. The application uses a Next.js web frontend and a NestJS HTTP API backed by PostgreSQL. Its source code and implementation details are available in the TaskFlow App repository on GitHub.",
        "TaskFlow is presented as a software project by its maintainer. This page does not claim that TaskFlow is a separately incorporated company, nor does it provide a business address or legal entity name.",
      ],
    },
    {
      heading: "Explore the project",
      paragraphs: [
        "Read the TaskFlow API guide for information about the HTTP API and authentication, visit the interactive API reference for endpoint schemas, or review the source repository. Use the Contact page to report a bug or ask a project question.",
      ],
    },
  ],
};

export const contactContent = {
  title: "Contact TaskFlow",
  intro:
    "TaskFlow is maintained by Pratik Dhandare (Code2WithPratik). The public project repository is the support and feedback channel for this software project.",
  sections: [
    {
      heading: "Report a problem or suggest an improvement",
      paragraphs: [
        "For a reproducible bug, feature request, or question about TaskFlow, open an issue in the TaskFlow App GitHub repository. Include the affected page or API endpoint, the steps that reproduce the problem, and what you expected to happen. If relevant, include your browser and operating system versions.",
        "Do not include passwords, access tokens, refresh cookies, private project content, personal information, or production secrets in a public issue. For a suspected security issue, use GitHub's private vulnerability reporting for the repository if it is available rather than publishing exploit details.",
      ],
    },
    {
      heading: "Project maintainer",
      paragraphs: [
        "Pratik Dhandare publishes software projects under the Code2WithPratik name. You can find the maintainer's public profile on GitHub and the TaskFlow source repository there. TaskFlow does not publish a separate support email address, telephone number, office address, or guaranteed response time on this website.",
      ],
    },
    {
      heading: "Account and privacy requests",
      paragraphs: [
        "For a question about account data or this website's privacy practices, contact the maintainer through the repository or public profile above. Do not post confidential account details in a public issue. The Privacy page explains the information TaskFlow handles and the service integrations currently used.",
      ],
    },
  ],
};

export const privacyContent = {
  title: "TaskFlow Privacy",
  intro:
    "This page describes the account, workspace, browser, and service data involved when using TaskFlow. TaskFlow is maintained by Pratik Dhandare (Code2WithPratik).",
  sections: [
    {
      heading: "Information stored by TaskFlow",
      paragraphs: [
        "When you register, TaskFlow stores the name and email address you provide and a bcrypt password hash; the application does not store your password in plain text. When you use the service, it stores workspace information you submit, such as project names and descriptions, task details, assignments, due dates, comments, notifications, and project membership. The API stores this application data in its configured PostgreSQL database.",
        "If a project administrator connects GitHub, TaskFlow stores installation and repository-link information needed for that integration. Depending on the features used, the application reads repository metadata, issues, pull requests, and check status from GitHub to connect engineering work to tasks.",
      ],
    },
    {
      heading: "Authentication and browser storage",
      paragraphs: [
        "TaskFlow keeps the short-lived access token in application memory in the browser. The refresh token is sent in an HttpOnly cookie scoped to the authentication routes. In production the cookie is Secure and uses SameSite=None for the separate frontend and API origins; local development uses SameSite=Lax. Logging out revokes the active refresh token and clears the cookie. The light or dark theme preference is stored in browser local storage under the taskflow-theme key.",
      ],
    },
    {
      heading: "Hosting, analytics, and integrations",
      paragraphs: [
        "The published deployment guide configures Vercel for the frontend and Render for the NestJS API and PostgreSQL database. The operator may change hosting providers or deployment settings. The frontend includes Vercel Web Analytics and Speed Insights to measure site activity and performance. Vercel processes data under its own privacy terms; review Vercel's privacy policy for details.",
        "When you choose to connect GitHub, GitHub processes authentication and repository access under GitHub's terms and privacy statement. TaskFlow's GitHub integration is optional and project members should only connect repositories they are authorized to use.",
      ],
    },
    {
      heading: "Retention and requests",
      paragraphs: [
        "TaskFlow does not currently publish a fixed data-retention schedule or provide self-service account deletion. To ask about account data, access, correction, or deletion, contact the maintainer using the method on the Contact page. A request may need enough information to identify the account, but do not send passwords, tokens, or other authentication secrets.",
      ],
    },
    {
      heading: "Updates to this notice",
      paragraphs: [
        "This notice describes the application's current behavior and configured integrations, not a promise that every deployment uses the same infrastructure. If the data collected or service providers change, this page should be updated to reflect those changes.",
      ],
    },
  ],
};
