"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarDays, CirclePlus, ExternalLink, Plus } from "@/components/animated-icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "@/components/query-state";
import { AssigneePicker } from "@/components/assignee-picker";
import { IconHover } from "@/components/icon-hover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/ui/page-heading";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { PaginatedTasks, Project, ProjectMember, Task, TaskPriority, TaskStatus } from "@/types/api";

const columns: Array<{ status: TaskStatus; label: string; tone: string }> = [
  { status: "TODO", label: "To do", tone: "bg-danger" },
  { status: "IN_PROGRESS", label: "In progress", tone: "bg-warning" },
  { status: "DONE", label: "Done", tone: "bg-success" },
];
const taskSchema = z.object({
  title: z.string().trim().min(1, "Enter a task title").max(200),
  description: z.string().max(5000, "Description is too long"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assigneeIds: z.array(z.string()),
  dueDate: z.string(),
});
type TaskValues = z.infer<typeof taskSchema>;

export default function ProjectBoardPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => apiFetch<Project>(`/projects/${id}`),
  });
  const tasksQuery = useQuery({
    queryKey: ["project-tasks", id],
    queryFn: () =>
      apiFetch<PaginatedTasks>(`/tasks?projectId=${encodeURIComponent(id)}&limit=100`),
  });
  const membersQuery = useQuery({
    queryKey: ["project-members", id],
    queryFn: () => apiFetch<ProjectMember[]>(`/projects/${id}/members`),
  });
  const createTask = useMutation({
    mutationFn: (values: TaskValues) =>
      apiFetch<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          projectId: id,
          title: values.title,
          description: values.description.trim() || undefined,
          assigneeIds: values.assigneeIds,
          dueDate: values.dueDate
            ? new Date(`${values.dueDate}T23:59:59.999`).toISOString()
            : null,
          priority: values.priority,
        }),
      }),
    onSuccess: async () => {
      await invalidateBoard();
      setDialogOpen(false);
      reset();
      setActionError(null);
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });
  const updateTask = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      apiFetch<Task>(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      setActionError(null);
      await invalidateBoard();
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      assigneeIds: [],
      dueDate: "",
    },
  });
  const selectedAssigneeIds = useWatch({
    control,
    name: "assigneeIds",
  });

  async function invalidateBoard() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["project-tasks", id] }),
      queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["project", id] }),
    ]);
  }

  if (projectQuery.isLoading || tasksQuery.isLoading || membersQuery.isLoading) {
    return <LoadingState label="Loading project board…" />;
  }
  const pageError = projectQuery.error ?? tasksQuery.error ?? membersQuery.error;
  if (pageError) {
    return (
      <ErrorState
        error={pageError}
        onRetry={() => {
          void projectQuery.refetch();
          void tasksQuery.refetch();
          void membersQuery.refetch();
        }}
      />
    );
  }
  if (!projectQuery.data || !tasksQuery.data || !membersQuery.data) {
    return <ErrorState error={new Error("Board data is missing.")} onRetry={() => void tasksQuery.refetch()} />;
  }

  const tasks = tasksQuery.data.data;

  return (
    <div>
      <IconHover>
        <Link
          href={`/projects/${id}`}
          className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-brand"
        >
          <ArrowLeft size={14} /> {projectQuery.data.name}
        </Link>
      </IconHover>
      <PageHeading
        eyebrow="Project board"
        title={projectQuery.data.name}
        description="Drag tasks between columns to keep everyone in sync."
        action={
          <Button
            onClick={() => {
              setActionError(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> Add task
          </Button>
        }
      />
      {actionError ? (
        <p className="mb-5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger-foreground" role="alert">
          {actionError}
        </p>
      ) : null}
      <div
        aria-label="Task board columns"
        className="scrollbar-hidden -mx-4 grid auto-cols-[minmax(min(85vw,22rem),1fr)] grid-flow-col gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid-flow-row lg:grid-cols-2 lg:overflow-visible xl:grid-cols-3"
        role="region"
        tabIndex={0}
      >
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.status);
          return (
            <section
              key={column.status}
              aria-label={`${column.label} tasks`}
              className="min-w-0 rounded-2xl bg-surface-secondary/70 p-3 sm:p-4"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const taskId = event.dataTransfer.getData("text/taskflow-task");
                const task = tasks.find((item) => item.id === taskId);
                if (task && task.status !== column.status) {
                  updateTask.mutate({ taskId, status: column.status });
                }
              }}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className={`size-2 rounded-full ${column.tone}`} />
                  {column.label}
                </h2>
                <span className="grid min-w-6 place-items-center rounded-lg bg-surface px-2 py-1 text-[10px] font-medium text-muted">
                  {columnTasks.length}
                </span>
              </div>
              <div className="min-h-36 space-y-3">
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/taskflow-task", task.id);
                    }}
                    className="glass-interactive cursor-grab p-4 active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="min-w-0 flex-1 line-clamp-2 text-sm font-medium leading-5 text-foreground hover:text-brand"
                      >
                        {task.title}
                      </Link>
                      <Link
                        href={`/tasks/${task.id}`}
                        aria-label={`Open ${task.title}`}
                        className="shrink-0 text-muted hover:text-brand"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                    {task.description ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                        {task.description}
                      </p>
                    ) : null}
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Badge>{task.status}</Badge>
                        <Badge>{task.priority}</Badge>
                      </span>
                      {task.dueDate ? (
                        <span className="flex items-center gap-1 text-[10px] text-muted">
                          <CalendarDays size={12} /> {formatDate(task.dueDate)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      {task.assignees.length ? (
                        <span className="flex -space-x-2">
                          {task.assignees.map((assignee) => (
                            <UserAvatar
                              key={assignee.id}
                              className="size-7 border-2 border-surface text-[9px]"
                              title={assignee.name}
                              name={assignee.name}
                              avatar={assignee.avatar}
                            />
                          ))}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted">Unassigned</span>
                      )}
                      <select
                        aria-label={`Status for ${task.title}`}
                        className="h-9 max-w-32 rounded-lg border border-border bg-surface px-2 text-[10px] text-muted outline-none focus:border-brand"
                        value={task.status}
                        disabled={updateTask.isPending}
                        onChange={(event) =>
                          updateTask.mutate({
                            taskId: task.id,
                            status: event.target.value as TaskStatus,
                          })
                        }
                      >
                        {columns.map((item) => (
                          <option key={item.status} value={item.status}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Card>
                ))}
                {columnTasks.length === 0 ? (
                  <IconHover>
                    <button
                      className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-xs text-muted transition hover:border-brand/40 hover:text-brand"
                      onClick={() => setDialogOpen(true)}
                      type="button"
                    >
                      <CirclePlus size={17} />
                      Drop a task here or add one
                    </button>
                  </IconHover>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      {dialogOpen ? (
        <div
          className="modal-overlay scrollbar-hidden fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-3 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialogOpen(false);
          }}
        >
          <section
            aria-labelledby="create-task-title"
            aria-modal="true"
            className="modal-scroll scrollbar-hidden my-auto w-full max-w-lg rounded-2xl border border-border bg-surface p-4 shadow-2xl sm:p-6"
            role="dialog"
            tabIndex={0}
          >
            <h2 className="text-lg font-semibold text-foreground" id="create-task-title">
              Add a task
            </h2>
            <p className="mt-1 text-sm text-muted">Add a clear next step to this project.</p>
            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit((values) => createTask.mutate(values))}
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="task-title">
                  Task title
                </label>
                <Input autoFocus id="task-title" placeholder="Prepare the launch brief" {...register("title")} />
                {errors.title ? <p className="mt-1 text-xs text-danger-foreground">{errors.title.message}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="task-description">
                  Description <span className="font-normal text-muted">· optional</span>
                </label>
                <Textarea id="task-description" rows={3} placeholder="Add helpful context…" {...register("description")} />
                {errors.description ? <p className="mt-1 text-xs text-danger-foreground">{errors.description.message}</p> : null}
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Priority</span>
                <select
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand"
                  {...register("priority")}
                >
                  {(["LOW", "MEDIUM", "HIGH"] as TaskPriority[]).map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </label>
              <AssigneePicker
                members={membersQuery.data}
                selectedIds={selectedAssigneeIds}
                onChange={(assigneeIds) =>
                  setValue("assigneeIds", assigneeIds, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="task-due-date">
                  Due date <span className="font-normal text-muted">· optional</span>
                </label>
                <Input id="task-due-date" type="date" {...register("dueDate")} />
              </div>
              {actionError ? <p className="text-sm text-danger-foreground" role="alert">{actionError}</p> : null}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" disabled={createTask.isPending} onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTask.isPending}>
                  <Plus size={15} /> {createTask.isPending ? "Adding…" : "Add task"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
