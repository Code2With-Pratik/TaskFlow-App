import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptsMarkdown,
  createAgentMarkdownResponse,
  homepageMarkdown,
  isKnownAppPath,
  notFoundMarkdown,
} from "./agent-content.mjs";

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
    createAgentMarkdownResponse("/login", "GET", "text/markdown"),
    null,
  );
});
