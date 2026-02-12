"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function Modal({ open, onClose, title, children, actions }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto max-w-lg rounded-xl border border-border bg-bg-secondary p-0 text-text-primary backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-lg p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-5">{children}</div>
      {actions && (
        <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
          {actions}
        </div>
      )}
    </dialog>
  );
}
