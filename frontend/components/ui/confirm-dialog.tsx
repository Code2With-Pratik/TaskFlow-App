"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      cancelButtonRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="confirm-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      onClose={onCancel}
      role="alertdialog"
    >
      <div className="flex items-start gap-4 p-5 sm:p-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger-foreground">
          <AlertTriangle aria-hidden="true" size={19} />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-base font-semibold leading-6 text-foreground" id={titleId}>
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-muted" id={descriptionId}>
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-border bg-surface-secondary/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <Button
          autoFocus
          className="w-full sm:w-auto"
          onClick={onCancel}
          ref={cancelButtonRef}
          variant="ghost"
        >
          Cancel
        </Button>
        <Button className="w-full sm:w-auto" onClick={onConfirm} variant="danger">
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
