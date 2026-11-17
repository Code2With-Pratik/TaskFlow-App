"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "@/components/animated-icons";
import type { ProjectMember } from "@/types/api";

export function AssigneePicker({
  members,
  selectedIds,
  onChange,
  disabled = false,
  disabledHint,
}: {
  members: ProjectMember[];
  selectedIds: string[];
  onChange: (userIds: string[]) => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node) || !pickerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectedMembers = members.filter(({ user }) =>
    selectedIds.includes(user.id),
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Assignees
      </label>
      <div className="relative" ref={pickerRef}>
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 text-left text-sm text-foreground outline-none transition hover:bg-surface-secondary focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          onClick={() => setOpen((isOpen) => !isOpen)}
          type="button"
        >
          <span className="truncate">
            {selectedMembers.length
              ? selectedMembers.map(({ user }) => user.name).join(", ")
              : "Select project members"}
          </span>
          <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
            {selectedIds.length ? selectedIds.length : null}
            <svg
              aria-hidden="true"
              className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              fill="none"
              height="16"
              viewBox="0 0 24 24"
              width="16"
            >
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </span>
        </button>
        <div
          className={`absolute left-0 right-0 top-[calc(100%+0.375rem)] z-30 origin-top rounded-xl border border-border/80 bg-surface p-1.5 shadow-xl shadow-black/10 transition duration-150 ease-out ${
            open
              ? "visible translate-y-0 scale-100 opacity-100"
              : "invisible -translate-y-1 scale-[0.98] opacity-0"
          }`}
          role="listbox"
          aria-label="Project members"
          aria-multiselectable="true"
        >
          <div className="scrollbar-hidden max-h-48 overflow-y-auto">
            {members.map(({ user }) => {
              const selected = selectedIds.includes(user.id);
              return (
                <button
                  key={user.id}
                  aria-selected={selected}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-secondary"
                  onClick={() =>
                    onChange(
                      selected
                        ? selectedIds.filter((id) => id !== user.id)
                        : [...selectedIds, user.id],
                    )
                  }
                  role="option"
                  type="button"
                >
                  <span className="truncate">{user.name}</span>
                  {selected ? <Check className="shrink-0 text-brand" size={15} /> : null}
                </button>
              );
            })}
            {members.length === 0 ? (
              <p className="px-2.5 py-2 text-xs text-muted">No project members available.</p>
            ) : null}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted">
        {disabled
          ? disabledHint ?? "Only project owners and admins can change assignees."
          : "Select one or more project members."}
      </p>
    </div>
  );
}
