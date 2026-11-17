"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "@/components/mention-textarea";
import { apiFetch, getErrorMessage } from "@/lib/api";
import type { Comment, ProjectMember } from "@/types/api";

export function CommentReplyComposer({
  taskId,
  parentId,
  members,
}: {
  taskId: string;
  parentId: string;
  members: ProjectMember[];
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const reply = useMutation({
    mutationFn: () =>
      apiFetch<Comment>(`/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content,
          parentId,
          mentionedUserIds,
        }),
      }),
    onSuccess: async () => {
      setContent("");
      setMentionedUserIds([]);
      setOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["task-comments", taskId],
      });
    },
  });

  return (
    <div className="mt-3">
      {!open ? (
        <button
          className="text-xs font-medium text-brand hover:underline"
          onClick={() => setOpen(true)}
          type="button"
        >
          Reply
        </button>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (content.trim()) reply.mutate();
          }}
        >
          <MentionTextarea
            aria-label="Write a reply"
            members={members}
            mentionIds={mentionedUserIds}
            onMentionIdsChange={setMentionedUserIds}
            onValueChange={setContent}
            placeholder="Write a reply…"
            rows={2}
            value={content}
          />
          {reply.error ? (
            <p className="text-xs text-danger-foreground" role="alert">
              {getErrorMessage(reply.error)}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              disabled={reply.isPending}
              onClick={() => {
                setOpen(false);
                setContent("");
                setMentionedUserIds([]);
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={!content.trim() || reply.isPending}
              size="sm"
              type="submit"
            >
              {reply.isPending ? "Sending…" : "Reply"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
