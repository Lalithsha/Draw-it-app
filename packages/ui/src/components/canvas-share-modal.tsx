"use client";
import React from "react";
// Use raw elements with explicit classes to avoid relying on design tokens

export interface CanvasShareModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  shareLink?: string;
  onCopy?: () => void;
  onStartSession?: () => Promise<void> | void;
  userName?: string;
}

export function CanvasShareModal({
  open,
  onClose,
  title = "Live collaboration",
  shareLink,
  onCopy,
  onStartSession,
  userName,
}: CanvasShareModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white dark:bg-neutral-900 p-6 shadow-xl text-black dark:text-white">
        <div className="mb-4 text-lg font-semibold">{title}</div>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              Your name
            </div>
            <input
              readOnly
              value={userName ?? "Anonymous"}
              className="w-full rounded border border-black/10 dark:border-white/10 px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-800 text-black dark:text-white"
            />
          </div>
          <div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              Link
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareLink ?? "Generating..."}
                className="flex-1 rounded border border-black/10 dark:border-white/10 px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-800 text-black dark:text-white"
              />
              <button
                onClick={onCopy}
                className="rounded bg-black px-3 py-2 text-white text-sm hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="pt-2 flex gap-2">
            <button
              onClick={onStartSession}
              className="rounded bg-black px-4 py-2 text-white text-sm hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              Start session
            </button>
            <button
              onClick={onClose}
              className="rounded border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
