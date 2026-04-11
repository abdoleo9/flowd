"use client";

import { createContext, useContext, useState } from "react";

interface MobileNavContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const MobileNavContext = createContext<MobileNavContextValue>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
});

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileNavContext.Provider value={{ open, setOpen, toggle: () => setOpen((o) => !o) }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  return useContext(MobileNavContext);
}
