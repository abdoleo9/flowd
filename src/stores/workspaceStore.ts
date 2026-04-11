import { create } from "zustand";
import type { TeamRole } from "@/types/database";

interface WorkspaceState {
  workspaceId: string | null;
  userRole: TeamRole | null;
  workspaceName: string | null;
  setWorkspace: (id: string, role: TeamRole, name: string) => void;
  clear: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaceId: null,
  userRole: null,
  workspaceName: null,
  setWorkspace: (id, role, name) => set({ workspaceId: id, userRole: role, workspaceName: name }),
  clear: () => set({ workspaceId: null, userRole: null, workspaceName: null }),
}));

// Role permission helpers
export function canManageOrders(role: TeamRole | null): boolean {
  return role !== null && ["owner", "admin", "confirmer"].includes(role);
}

export function canManageTeam(role: TeamRole | null): boolean {
  return role !== null && ["owner", "admin"].includes(role);
}

export function canAccessChatbot(role: TeamRole | null): boolean {
  return role !== null && ["owner", "admin", "agent"].includes(role);
}

export function canAccessBilling(role: TeamRole | null): boolean {
  return role === "owner";
}

export function canManageIntegrations(role: TeamRole | null): boolean {
  return role !== null && ["owner", "admin"].includes(role);
}
