import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptsMarkdown,
  createAgentMarkdownResponse,
  homepageMarkdown,
  isKnownAppPath,
  notFoundMarkdown,
} from "./agent-content.mjs";
import { agentGuidance } from "./agent-guidance.mjs";
import {
  aboutContent,
  contactContent,
  privacyContent,
} from "./trust-content.mjs";

test("accepts explicit Markdown media ranges with a positive quality", () => {
  assert.equal(acceptsMarkdown("text/markdown"), true);
  assert.equal(acceptsMarkdown("text/html, text/markdown;q=0.8"), true);
  assert.equal(acceptsMarkdown("Text/Markdown; q=1"), true);
});

test("does not negotiate Markdown when it is absent or unacceptable", () => {
  assert.equal(acceptsMarkdown(null), false);
  assert.equal(acceptsMarkdown("text/html, */*;q=0.8"), false);
  assert.equal(acceptsMarkdown("text/markdown;q=0"), false);
  assert.equal(acceptsMarkdown("text/markdown;q=invalid"), false);
});

test("identifies existing static and dynamic application routes", () => {
  assert.equal(isKnownAppPath("/"), true);
  assert.equal(isKnownAppPath("/login/"), true);
  assert.equal(isKnownAppPath("/projects/project-123/board"), true);
  assert.equal(isKnownAppPath("/tasks/task-123"), true);
  assert.equal(isKnownAppPath("/__ora-404-probe-61ar21wy"), false);
});

test("Markdown documents include product information and a documentation link", () => {
  assert.ok(homepageMarkdown.length > 500);
  assert.match(homepageMarkdown, /project and task management software/i);
  assert.match(notFoundMarkdown, /\[TaskFlow documentation\]\(\/llms\.txt\)/);
});

test("homepage negotiation returns Markdown with Vary: Accept", async () => {
  const response = createAgentMarkdownResponse("/", "GET", "text/markdown");

  assert.equal(response?.status, 200);
  assert.match(response?.headers.get("content-type") ?? "", /^text\/markdown/);
  assert.match(response?.headers.get("vary") ?? "", /\baccept\b/i);
  assert.ok((await response?.text())?.length > 500);
});

test("unknown Markdown paths return linked 404 responses", async () => {
  const response = createAgentMarkdownResponse(
    "/__ora-404-probe-61ar21wy",
    "GET",
    "text/markdown",
  );

  assert.equal(response?.status, 404);
  assert.match(response?.headers.get("content-type") ?? "", /^text\/markdown/);
  assert.match(await response?.text() ?? "", /\[TaskFlow documentation\]/);
});

test("HTML requests and known page paths continue to Next.js", () => {
  assert.equal(createAgentMarkdownResponse("/", "GET", "text/html"), null);
  assert.equal(
    createAgentMarkdownResponse("/developers/api", "GET", "text/markdown"),
    null,
  );
});

test("agent guidance defines use cases, authorization, and unavailable tools", () => {
  assert.match(agentGuidance, /When to use TaskFlow/);
  assert.match(agentGuidance, /project planning and day-to-day team task coordination/);
  assert.match(agentGuidance, /never write or delete workspace data without the user's clear instruction/);
  assert.match(agentGuidance, /does not currently publish an MCP server, SDK, or command-line tool/);
});

test("About, Contact, and Privacy pages each provide a substantive trust anchor", () => {
  for (const page of [aboutContent, contactContent, privacyContent]) {
    const text = [
      page.title,
      page.intro,
      ...page.sections.flatMap((section) => [
        section.heading,
        ...section.paragraphs,
      ]),
    ].join(" ");

    assert.ok(text.length >= 500, `${page.title} has ${text.length} characters`);
  }
  assert.match(privacyContent.sections.flatMap((section) => section.paragraphs).join(" "), /Vercel Web Analytics and Speed Insights/);
});
