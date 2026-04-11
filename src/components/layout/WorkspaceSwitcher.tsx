"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Check, Store } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { WILAYAS } from "@/constants/wilayas";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace, refetchWorkspaces } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", wilayaCode: "16" });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSwitch(id: string) {
    if (id === activeWorkspace?.id) { setOpen(false); return; }
    setSwitching(id);
    await switchWorkspace(id);
    setSwitching(null);
    setOpen(false);
  }

  async function handleCreate() {
    if (!form.name.trim()) { toast.error("Entrez un nom pour la boutique"); return; }
    setCreating(true);
    const res = await fetch("/api/workspace/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, phone: form.phone, wilayaCode: form.wilayaCode }),
    });
    if (!res.ok) { toast.error("Erreur lors de la création"); setCreating(false); return; }
    const { workspaceId } = await res.json();
    await refetchWorkspaces();
    await switchWorkspace(workspaceId);
    toast.success(`Boutique "${form.name}" créée !`);
    setCreating(false);
    setCreateOpen(false);
    setForm({ name: "", phone: "", wilayaCode: "16" });
  }

  const name = activeWorkspace?.name ?? "Workspace";
  const initial = name[0]?.toUpperCase() ?? "W";

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2.5 hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-white truncate">{name}</p>
            <p className="text-xs text-muted truncate">{activeWorkspace?.role ?? "owner"}</p>
          </div>
          <ChevronDown
            size={14}
            className={cn("text-muted-foreground transition-transform flex-shrink-0", open && "rotate-180")}
          />
        </button>

        {open && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-xl shadow-xl py-1 z-50">
            <p className="px-3 py-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Mes boutiques
            </p>

            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSwitch(ws.id)}
                disabled={switching === ws.id}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                  {ws.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{ws.name}</p>
                  <p className="text-xs text-muted truncate capitalize">{ws.role}</p>
                </div>
                {ws.id === activeWorkspace?.id && (
                  <Check size={14} className="text-accent flex-shrink-0" />
                )}
                {switching === ws.id && (
                  <div className="w-3.5 h-3.5 border border-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
              </button>
            ))}

            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={() => { setOpen(false); setCreateOpen(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left text-accent"
              >
                <div className="w-6 h-6 rounded-full border border-accent/30 flex items-center justify-center flex-shrink-0">
                  <Plus size={12} />
                </div>
                <span className="text-sm font-medium">Nouvelle boutique</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create workspace modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Créer une nouvelle boutique"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button
              loading={creating}
              icon={<Store size={14} />}
              disabled={!form.name.trim()}
              onClick={handleCreate}
            >
              Créer la boutique
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Créez une boutique supplémentaire pour gérer un autre business indépendamment.
          </p>
          <Input
            label="Nom de la boutique"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ma Deuxième Boutique"
            autoFocus
          />
          <Input
            label="Téléphone (optionnel)"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="0555 123 456"
          />
          <Select
            label="Wilaya"
            value={form.wilayaCode}
            onChange={(e) => setForm((p) => ({ ...p, wilayaCode: e.target.value }))}
          >
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>{w.code} - {w.name}</option>
            ))}
          </Select>
        </div>
      </Modal>
    </>
  );
}
