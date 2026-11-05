"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const VisitorCount = createContext<number | null>(null);

export function VisitorCounter({ children }: { children: ReactNode }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/visitors", { method: "POST", cache: "no-store" })
      .then(async (response) => response.ok ? await response.json() as { count: number } : null)
      .then((result) => {
        if (result && Number.isSafeInteger(result.count) && result.count >= 0) setCount(result.count);
      }).catch(() => {});
  }, []);

  return <VisitorCount.Provider value={count}>{children}</VisitorCount.Provider>;
}

export function useVisitorCount() {
  return useContext(VisitorCount);
}
