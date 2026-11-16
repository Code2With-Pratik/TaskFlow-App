"use client";

import { AlertTriangle } from "@/components/animated-icons";
import { IconHover } from "@/components/icon-hover";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  pending?: boolean;
  pendingLabel?: string;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  pendingLabel = "Working…",
  error,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const submittedRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) {
      dialog.showModal();
      cancelButtonRef.current?.focus();
    }

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  useEffect(() => {
    if (!pending) submittedRef.current = false;
  }, [pending]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={
        [description ? descriptionId : null, error ? errorId : null]
          .filter(Boolean)
          .join(" ") || undefined
      }
      aria-busy={pending}
      className="confirm-dialog fixed left-1/2 top-1/2 m-0 flex max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-[calc(100vw-2rem-env(safe-area-inset-left)-env(safe-area-inset-right))] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      onClick={(event) => {
        if (!pending && event.target === event.currentTarget) onCancel();
      }}
      role="alertdialog"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
        <IconHover>
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger-foreground">
              <AlertTriangle aria-hidden="true" size={19} />
            </span>
            <div className="min-w-0 pt-0.5">
              <h2 className="break-words text-base font-semibold leading-6 text-foreground" id={titleId}>
                {title}
              </h2>
              {description ? (
                <p className="mt-2 break-words text-sm leading-6 text-muted" id={descriptionId}>
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </IconHover>
        {error ? (
          <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5 text-sm text-danger-foreground" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-surface-secondary/60 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end sm:px-6">
        <Button
          autoFocus
          className="w-full sm:w-auto"
          onClick={onCancel}
          ref={cancelButtonRef}
          disabled={pending}
          variant="ghost"
        >
          Cancel
        </Button>
        <Button
          aria-live="polite"
          className="w-full bg-[#d00000] text-white hover:bg-[#b80000] active:bg-[#a30000] sm:w-auto"
          disabled={pending}
          onClick={() => {
            if (pending || submittedRef.current) return;
            submittedRef.current = true;
            onConfirm();
          }}
          variant="danger"
        >
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
