"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: "md:max-w-md",
  md: "md:max-w-lg",
  lg: "md:max-w-2xl",
  xl: "md:max-w-3xl",
};

export function Modal({ open, onClose, title, children, size = "md", footer }: ModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel — bottom sheet on mobile, centered modal on sm+ */}
      <div
        className={cn(
          "relative w-full bg-card border border-border shadow-xl animate-fade-in",
          "rounded-t-2xl sm:rounded-2xl",
          "max-h-[92dvh] sm:max-h-[85vh] flex flex-col",
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {/* Body — scrollable */}
        <div className="p-4 md:p-5 overflow-y-auto flex-1">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 md:px-5 py-4 border-t border-border flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
