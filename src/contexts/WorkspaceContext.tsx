"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface WorkspaceContextValue {
  workspaces: WorkspaceInfo[];
  activeWorkspace: WorkspaceInfo | null;
  switchWorkspace: (id: string) => Promise<void>;
  refetchWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  activeWorkspace: null,
  switchWorkspace: async () => {},
  refetchWorkspaces: async () => {},
});

interface WorkspaceProviderProps {
  children: React.ReactNode;
  initialWorkspaces: WorkspaceInfo[];
  initialActiveId: string;
}

export function WorkspaceProvider({
  children,
  initialWorkspaces,
  initialActiveId,
}: WorkspaceProviderProps) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>(initialWorkspaces);
  const [activeId, setActiveId] = useState(initialActiveId);

  const activeWorkspace = workspaces.find((w) => w.id === activeId) ?? workspaces[0] ?? null;

  const switchWorkspace = useCallback(async (id: string) => {
    await fetch("/api/workspace/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: id }),
    });
    setActiveId(id);
    router.refresh();
  }, [router]);

  const refetchWorkspaces = useCallback(async () => {
    const res = await fetch("/api/workspace");
    if (res.ok) {
      const data = await res.json();
      setWorkspaces(data.workspaces);
    }
  }, []);

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, switchWorkspace, refetchWorkspaces }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
