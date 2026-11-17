import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptsMarkdown,
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
