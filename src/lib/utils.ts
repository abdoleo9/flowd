import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDA(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return (
    new Intl.NumberFormat("fr-DZ", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " DA"
  );
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd/MM/yyyy", { locale: fr });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: fr });
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}
