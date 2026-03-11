"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type V2HeaderSlotContextValue = {
  headerContent: ReactNode | null;
  setHeaderContent: (node: ReactNode | null) => void;
  clearHeaderContent: () => void;
};

const V2HeaderSlotContext = createContext<V2HeaderSlotContextValue | null>(
  null,
);

export function V2HeaderSlotProvider({ children }: { children: ReactNode }) {
  const [headerContent, setHeaderContent] = useState<ReactNode | null>(null);

  const clearHeaderContent = useCallback(() => {
    setHeaderContent(null);
  }, []);

  const value = useMemo<V2HeaderSlotContextValue>(
    () => ({
      headerContent,
      setHeaderContent,
      clearHeaderContent,
    }),
    [headerContent, clearHeaderContent],
  );

  return (
    <V2HeaderSlotContext.Provider value={value}>
      {children}
    </V2HeaderSlotContext.Provider>
  );
}

export function useV2HeaderSlotContext() {
  const context = useContext(V2HeaderSlotContext);
  if (!context) {
    throw new Error(
      "useV2HeaderSlotContext must be used within V2HeaderSlotProvider.",
    );
  }
  return context;
}

export function V2HeaderSlot() {
  const { headerContent } = useV2HeaderSlotContext();
  return <>{headerContent}</>;
}
