"use client";

import { X } from "lucide-react";

export function ModalShell({
  title,
  children,
  onClose
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-3 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-950"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
