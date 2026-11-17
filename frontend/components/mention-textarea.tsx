"use client";

import { useState, type ComponentProps, type ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectMember } from "@/types/api";

type MentionMatch = { start: number; end: number; query: string };

type MentionTextareaProps = Omit<
  ComponentProps<typeof Textarea>,
  "onChange" | "value"
> & {
  value: string;
  members: ProjectMember[];
  mentionIds: string[];
  onMentionIdsChange: (ids: string[]) => void;
  onValueChange: (value: string) => void;
};

export function MentionTextarea({
  value,
  members,
  mentionIds,
  onMentionIdsChange,
  onValueChange,
  ...textareaProps
}: MentionTextareaProps) {
  const [match, setMatch] = useState<MentionMatch | null>(null);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = event.target.value;
    const caret = event.target.selectionStart;
    const prefix = nextValue.slice(0, caret);
    const mentionMatch = /(?:^|\s)@([A-Za-z0-9._-]*)$/.exec(prefix);
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMatch({
        start: caret - query.length - 1,
        end: caret,
        query,
      });
    } else {
      setMatch(null);
    }

    onValueChange(nextValue);
    onMentionIdsChange(
      mentionIds.filter((id) => {
        const member = members.find((item) => item.user.id === id);
        return member ? nextValue.includes(`@${member.user.name}`) : false;
      }),
    );
  }

  const suggestions =
    match === null
      ? []
      : members
          .filter((member) =>
            member.user.name.toLowerCase().includes(match.query.toLowerCase()),
          )
          .slice(0, 6);

  function selectMention(member: ProjectMember) {
    if (!match) return;
    const mention = `@${member.user.name} `;
    const nextValue =
      value.slice(0, match.start) + mention + value.slice(match.end);
    onValueChange(nextValue);
    onMentionIdsChange(
      Array.from(new Set([...mentionIds, member.user.id])),
    );
    setMatch(null);
  }

  return (
    <div className="relative">
      <Textarea
        {...textareaProps}
        onChange={handleChange}
        value={value}
      />
      {suggestions.length ? (
        <div
          className="absolute bottom-full left-0 z-20 mb-2 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-xl"
          role="listbox"
          aria-label="Mention a project member"
        >
          {suggestions.map((member) => (
            <button
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-surface-secondary"
              key={member.user.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectMention(member)}
              role="option"
              type="button"
            >
              <span className="font-medium text-foreground">{member.user.name}</span>
              {member.user.designation ? (
                <span className="ml-3 truncate text-muted">
                  {member.user.designation}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
