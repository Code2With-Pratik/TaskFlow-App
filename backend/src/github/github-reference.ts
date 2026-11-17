export function parseGitHubWorkReferences(...texts: string[]): {
  taskIds: Set<string>;
  closingIssueNumbers: Set<number>;
} {
  const taskIds = new Set<string>();
  const closingIssueNumbers = new Set<number>();
  const taskPattern =
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
  const closingIssuePattern =
    /(?:close[sd]?|fix(?:es|ed)?|resolve[sd]?)\s+(?:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)?#([1-9]\d*)/gi;

  for (const text of texts) {
    for (const taskId of text.match(taskPattern) ?? []) {
      taskIds.add(taskId.toLowerCase());
    }
    for (const match of text.matchAll(closingIssuePattern)) {
      const issueNumber = Number(match[1]);
      if (Number.isSafeInteger(issueNumber)) {
        closingIssueNumbers.add(issueNumber);
      }
    }
  }

  return { taskIds, closingIssueNumbers };
}
