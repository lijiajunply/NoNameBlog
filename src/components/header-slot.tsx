"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type HeaderSlotContextValue = {
  headerContent: ReactNode | null;
  setHeaderContent: (node: ReactNode | null) => void;
  clearHeaderContent: () => void;
};

const HeaderSlotContext = createContext<HeaderSlotContextValue | null>(null);

export function HeaderSlotProvider({ children }: { children: ReactNode }) {
  const [headerContent, setHeaderContent] = useState<ReactNode | null>(null);

  const clearHeaderContent = useCallback(() => {
    setHeaderContent(null);
  }, []);

  const value = useMemo<HeaderSlotContextValue>(
    () => ({
      headerContent,
      setHeaderContent,
      clearHeaderContent,
    }),
    [headerContent, clearHeaderContent],
  );

  return (
    <HeaderSlotContext.Provider value={value}>
      {children}
    </HeaderSlotContext.Provider>
  );
}

export function useHeaderSlotContext() {
  const context = useContext(HeaderSlotContext);
  if (!context) {
    throw new Error(
      "useHeaderSlotContext must be used within HeaderSlotProvider.",
    );
  }
  return context;
}

export function HeaderSlot() {
  const { headerContent } = useHeaderSlotContext();
  return <>{headerContent}</>;
}
