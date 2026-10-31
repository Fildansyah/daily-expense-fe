"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { QuickAddDialog } from "@/components/quick-add/quick-add-dialog";

export type QuickAddKind =
  | "transaction"
  | "bill"
  | "account"
  | "budget"
  | "category"
  | "transfer";

interface QuickAddContextValue {
  isOpen: boolean;
  initialKind: QuickAddKind | null;
  open: (kind?: QuickAddKind) => void;
  close: () => void;
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialKind, setInitialKind] = useState<QuickAddKind | null>(null);

  const open = useCallback((kind?: QuickAddKind) => {
    setInitialKind(kind ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ isOpen, initialKind, open, close }),
    [isOpen, initialKind, open, close],
  );

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <QuickAddDialog />
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd(): QuickAddContextValue {
  const context = useContext(QuickAddContext);
  if (!context) {
    throw new Error("useQuickAdd harus dipakai di dalam <QuickAddProvider>");
  }
  return context;
}
