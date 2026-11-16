"use client";

/* eslint-disable @next/next/no-img-element -- Comment screenshots are compressed inline data URLs. */

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  MessageSquare,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ClipboardEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "@/components/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/app/auth-provider";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { formatDate, fromDateInputValue, initials, toDateInputValue } from "@/lib/format";
import type { Comment, ProjectMember, Task, TaskPriority, TaskStatus } from "@/types/api";

const commentSchema = z.object({
  content: z.string().trim().min(1, "Write a comment first").max(5000, "Comment is too long"),
});
type CommentValues = z.infer<typeof commentSchema>;
type ConfirmationRequest = {
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
};

const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];
const MAX_SOURCE_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_COMPRESSED_IMAGE_BYTES = 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("The screenshot could not be read. Try copying it again."));
    };
    reader.onerror = () => reject(new Error("The screenshot could not be read. Try copying it again."));
    reader.readAsDataURL(blob);
  });
}

async function compressClipboardImage(file: File): Promise<string> {
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("This screenshot is too large to paste. Try a smaller image under 12 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This screenshot could not be opened. Copy it again or use a PNG, JPEG, or WebP image.");
  }

  try {
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / bitmap.width,
      MAX_IMAGE_DIMENSION / bitmap.height,
    );
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the screenshot. Try another image.");

    for (let resizeAttempt = 0; resizeAttempt < 5; resizeAttempt += 1) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of [0.86, 0.74, 0.62, 0.5]) {
        const compressed = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/webp", quality);
        });
        if (!compressed) continue;
        if (!SUPPORTED_IMAGE_TYPES.has(compressed.type)) {
          throw new Error("Your browser could not encode this screenshot. Try a PNG or JPEG image.");
        }
        if (compressed.size <= MAX_COMPRESSED_IMAGE_BYTES) {
          return readBlobAsDataUrl(compressed);
        }
      }

      width = Math.max(1, Math.floor(width * 0.78));
      height = Math.max(1, Math.floor(height * 0.78));
    }

    throw new Error("This screenshot is still too large after compression. Crop it or try a smaller image.");
  } finally {
    bitmap.close();
  }
}

export default function TaskDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [selectedCommentImage, setSelectedCommentImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const imagePasteRequestId = useRef(0);
  const imageDialogRef = useRef<HTMLDialogElement>(null);
  const taskQuery = useQuery({
    queryKey: ["task", id],
    queryFn: () => apiFetch<Task>(`/tasks/${id}`),
  });
  const task = taskQuery.data;
  const commentsQuery = useQuery({
    queryKey: ["task-comments", id],
    queryFn: () => apiFetch<Comment[]>(`/tasks/${id}/comments`),
  });
  const membersQuery = useQuery({
    queryKey: ["project-members", task?.projectId],
    queryFn: () => apiFetch<ProjectMember[]>(`/projects/${task?.projectId}/members`),
    enabled: Boolean(task?.projectId),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentValues>({ resolver: zodResolver(commentSchema) });
  const commentField = register("content");

  useEffect(() => {
    if (!selectedCommentImage) return;
    const dialog = imageDialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    return () => dialog.close();
  }, [selectedCommentImage]);

  const updateTask = useMutation({
    mutationFn: (
      updates: Partial<
        Pick<Task, "status" | "priority" | "assigneeId" | "dueDate">
      >,
    ) =>
      apiFetch<Task>(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task", id] }),
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["project-tasks", task?.projectId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });
  const addComment = useMutation({
    mutationFn: (values: CommentValues & { imageData?: string }) =>
      apiFetch<Comment>(`/tasks/${id}/comments`, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: async () => {
      reset();
      setCommentImage(null);
      setImageError(null);
      await queryClient.invalidateQueries({ queryKey: ["task-comments", id] });
      await queryClient.invalidateQueries({ queryKey: ["task", id] });
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const handleCommentPaste = async (
    event: ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    const imageItems = Array.from(event.clipboardData.items).filter(
      (item) => item.kind === "file" && item.type.startsWith("image/"),
    );
    if (!imageItems.length) return;

    const requestId = ++imagePasteRequestId.current;
    event.preventDefault();
    const item = imageItems[0];
    if (!SUPPORTED_IMAGE_TYPES.has(item.type)) {
      setImageError("That image type is not supported. Paste a PNG, JPEG, or WebP screenshot.");
      setIsPreparingImage(false);
      return;
    }
    const file = item.getAsFile();
    if (!file) {
      setImageError("The clipboard image could not be read. Copy it again and try once more.");
      setIsPreparingImage(false);
      return;
    }

    setImageError(null);
    setIsPreparingImage(true);
    try {
      const imageData = await compressClipboardImage(file);
      if (requestId === imagePasteRequestId.current) setCommentImage(imageData);
    } catch (error) {
      if (requestId === imagePasteRequestId.current) {
        setImageError(
          error instanceof Error
            ? error.message
            : "The screenshot could not be prepared. Try copying it again.",
        );
      }
    } finally {
      if (requestId === imagePasteRequestId.current) setIsPreparingImage(false);
    }
  };
  const deleteTask = useMutation({
    mutationFn: () => apiFetch<void>(`/tasks/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["project-tasks", task?.projectId] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setConfirmation(null);
      router.replace(`/projects/${task?.projectId}`);
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  if (taskQuery.isLoading || commentsQuery.isLoading || (task && membersQuery.isLoading)) {
    return <LoadingState label="Loading task…" />;
  }
  const pageError = taskQuery.error ?? commentsQuery.error ?? membersQuery.error;
  if (pageError) {
    return (
      <ErrorState
        error={pageError}
        onRetry={() => {
          void taskQuery.refetch();
          void commentsQuery.refetch();
          void membersQuery.refetch();
        }}
      />
    );
  }
  if (!task || !commentsQuery.data || !membersQuery.data) {
    return <ErrorState error={new Error("Task details are missing.")} onRetry={() => void taskQuery.refetch()} />;
  }

  const membership = membersQuery.data.find((member) => member.user.id === user?.id);
  const canDelete =
    task.createdById === user?.id ||
    membership?.role === "OWNER" ||
    membership?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/projects/${task.projectId}`}
        className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-brand"
      >
        <ArrowLeft size={14} /> {task.project.name}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
            Task details
          </p>
          <h1 className="break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {task.title}
          </h1>
          <div className="mt-3">
            <Badge>{task.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            Created by {task.createdBy.name} · {formatDate(task.createdAt)}
          </p>
        </div>
        {canDelete ? (
          <Button
            variant="danger"
            disabled={deleteTask.isPending}
            onClick={() => {
              setActionError(null);
              setConfirmation({
                title: `Delete "${task.title}"?`,
                description: "This cannot be undone.",
                confirmLabel: "Delete task",
                onConfirm: () => deleteTask.mutate(),
              });
            }}
          >
            <Trash2 size={15} />
            {deleteTask.isPending ? "Deleting…" : "Delete task"}
          </Button>
        ) : null}
      </div>

      {actionError ? (
        <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger-foreground" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-foreground">Description</h2>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted">
                {task.description || "No description has been added."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Comments</h2>
                <Badge>{commentsQuery.data.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="space-y-3"
                onSubmit={handleSubmit((values) =>
                  addComment.mutate({
                    ...values,
                    ...(commentImage ? { imageData: commentImage } : {}),
                  }),
                )}
              >
                <Textarea
                  aria-label="Write a comment"
                  aria-describedby={[
                    "comment-paste-hint",
                    errors.content ? "comment-content-error" : null,
                    imageError ? "comment-image-error" : null,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  placeholder="Share an update or ask a question…"
                  rows={3}
                  maxLength={5000}
                  aria-invalid={Boolean(errors.content)}
                  {...commentField}
                  onPaste={handleCommentPaste}
                />
                <p className="text-xs text-muted" id="comment-paste-hint">
                  You can also paste a screenshot.
                </p>
                {errors.content ? (
                  <p className="text-xs text-danger-foreground" id="comment-content-error">
                    {errors.content.message}
                  </p>
                ) : null}
                {imageError ? (
                  <p className="text-xs text-danger-foreground" id="comment-image-error" role="alert">
                    {imageError}
                  </p>
                ) : null}
                {isPreparingImage ? (
                  <p className="text-xs text-muted" aria-live="polite" role="status">
                    Preparing screenshot…
                  </p>
                ) : null}
                {commentImage ? (
                  <div className="relative w-fit max-w-full rounded-xl border border-border bg-surface-secondary p-2">
                    <img
                      alt="Screenshot preview for this comment"
                      className="max-h-64 max-w-full rounded-lg object-contain"
                      src={commentImage}
                    />
                    <Button
                      aria-label="Remove attached screenshot"
                      className="absolute right-3 top-3 size-8 rounded-full bg-surface/90 p-0 shadow-md"
                      onClick={() => {
                        setCommentImage(null);
                        setImageError(null);
                      }}
                      type="button"
                      variant="ghost"
                    >
                      <X aria-hidden="true" size={15} />
                    </Button>
                  </div>
                ) : null}
                <div className="flex justify-end">
                  <Button type="submit" disabled={addComment.isPending || isPreparingImage}>
                    {isPreparingImage ? <ImagePlus size={14} /> : <Send size={14} />}
                    {isPreparingImage
                      ? "Preparing screenshot…"
                      : addComment.isPending
                        ? "Sending…"
                        : "Add comment"}
                  </Button>
                </div>
              </form>

              {commentsQuery.data.length ? (
                <div className="divide-y divide-border border-t border-border">
                  {commentsQuery.data.map((comment) => (
                    <article key={comment.id} className="flex gap-3 py-4">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-[10px] font-semibold text-brand">
                        {initials(comment.user.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-xs font-semibold text-foreground">{comment.user.name}</span>
                          <span className="text-[10px] text-muted">{formatDate(comment.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">{comment.content}</p>
                        {comment.imageData ? (
                          <button
                            aria-label={`View screenshot attached to comment by ${comment.user.name}`}
                            className="mt-3 block w-fit max-w-full overflow-hidden rounded-xl border border-border bg-surface-secondary p-2 text-left"
                            onClick={() => {
                              const imageData = comment.imageData;
                              if (!imageData) return;
                              setSelectedCommentImage({
                                src: imageData,
                                alt: `Screenshot attached to comment by ${comment.user.name}`,
                              });
                            }}
                            type="button"
                          >
                            <img
                              alt={`Screenshot attached to comment by ${comment.user.name}`}
                              className="max-h-96 max-w-full rounded-lg object-contain"
                              decoding="async"
                              loading="lazy"
                              src={comment.imageData}
                            />
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="border-t border-border pt-4 text-center text-xs text-muted">
                  No comments yet. Start the conversation.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-foreground">Task properties</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-muted">Status</span>
                <select
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  value={task.status}
                  disabled={updateTask.isPending}
                  onChange={(event) => updateTask.mutate({ status: event.target.value as TaskStatus })}
                >
                  {statuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-muted">Priority</span>
                <select
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  value={task.priority}
                  disabled={updateTask.isPending}
                  onChange={(event) => updateTask.mutate({ priority: event.target.value as TaskPriority })}
                >
                  {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
              <div>
                <span className="mb-2 block text-xs font-medium text-muted">Assignee</span>
                <select
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  aria-label="Task assignee"
                  value={task.assigneeId ?? ""}
                  disabled={updateTask.isPending}
                  onChange={(event) =>
                    updateTask.mutate({ assigneeId: event.target.value || null })
                  }
                >
                  <option value="">Unassigned</option>
                  {membersQuery.data.map((member) => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="block">
                <label className="mb-2 block text-xs font-medium text-muted" htmlFor="task-due-date">
                  Due date
                </label>
                <input
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  id="task-due-date"
                  type="date"
                  value={toDateInputValue(task.dueDate)}
                  disabled={updateTask.isPending}
                  onChange={(event) =>
                    updateTask.mutate({
                      dueDate: fromDateInputValue(event.target.value),
                    })
                  }
                />
                <span className="sr-only">
                  {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                </span>
              </div>
              <div>
                <span className="mb-2 block text-xs font-medium text-muted">Project</span>
                <Link
                  className="text-sm font-medium text-brand hover:underline"
                  href={`/projects/${task.projectId}`}
                >
                  {task.project.name}
                </Link>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center gap-2 px-1 text-xs text-muted">
            <MessageSquare size={14} />
            {commentsQuery.data.length} comments
            <span className="ml-auto flex items-center gap-1">
              <Check size={13} /> Saved to project
            </span>
          </div>
        </aside>
      </div>
      <ConfirmDialog
        confirmLabel={confirmation?.confirmLabel ?? "Confirm"}
        description={confirmation?.description}
        error={confirmation ? actionError : null}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          if (!confirmation) return;
          confirmation.onConfirm();
        }}
        open={Boolean(confirmation)}
        pending={deleteTask.isPending}
        pendingLabel="Deleting…"
        title={confirmation?.title ?? ""}
      />
      {selectedCommentImage ? (
        <dialog
          aria-label="Screenshot viewer"
          className="fixed left-0 top-0 m-0 h-dvh w-screen max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0 text-foreground backdrop:bg-black/85"
          onCancel={() => setSelectedCommentImage(null)}
          ref={imageDialogRef}
        >
          <div
            className="relative grid h-full w-full place-items-center p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) setSelectedCommentImage(null);
            }}
          >
            <Button
              aria-label="Close screenshot"
              autoFocus
              className="absolute right-4 top-4 z-10 size-10 rounded-full bg-black/60 p-0 text-white hover:bg-black/80 hover:text-white"
              onClick={() => setSelectedCommentImage(null)}
              size="icon"
              variant="ghost"
            >
              <X aria-hidden="true" size={20} />
            </Button>
            <img
              alt={selectedCommentImage.alt}
              className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] rounded-lg object-contain"
              src={selectedCommentImage.src}
            />
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
