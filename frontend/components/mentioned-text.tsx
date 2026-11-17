import type { ReactNode } from "react";

export function MentionedText({
  text,
  names,
}: {
  text: string;
  names: string[];
}) {
  const tokens = Array.from(
    new Set(names.filter(Boolean).map((name) => `@${name}`)),
  ).sort((left, right) => right.length - left.length);
  const content: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length) {
    let matchIndex = -1;
    let matchedToken = "";
    for (const token of tokens) {
      const index = remaining.indexOf(token);
      if (index !== -1 && (matchIndex === -1 || index < matchIndex)) {
        matchIndex = index;
        matchedToken = token;
      }
    }

    if (matchIndex === -1) {
      content.push(remaining);
      break;
    }

    if (matchIndex > 0) content.push(remaining.slice(0, matchIndex));
    content.push(
      <span className="font-semibold text-danger-foreground" key={key++}>
        {matchedToken}
      </span>,
    );
    remaining = remaining.slice(matchIndex + matchedToken.length);
  }

  return <>{content}</>;
}
