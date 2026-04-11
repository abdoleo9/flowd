import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-white">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-background border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-muted outline-none transition-colors",
              "border-border focus:border-accent",
              icon && "pl-9",
              error && "border-danger focus:border-danger",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-white">{label}</label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent transition-colors appearance-none cursor-pointer",
            error && "border-danger",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-white">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent transition-colors resize-none",
            error && "border-danger",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
