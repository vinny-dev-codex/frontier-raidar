"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "./reading-language";

export function HomeViewCount({ locale }: { locale: Locale }) {
  const [count, setCount] = useState<number | null>(null);
  const requested = useRef(false);
  const english = locale === "en";

  useEffect(() => {
    function record() {
      fetch("/api/home-views", { method: "POST", cache: "no-store" })
        .then(async (response) => response.ok ? await response.json() as { count: number } : null)
        .then((result) => {
          if (result && Number.isSafeInteger(result.count) && result.count >= 0) {
            setCount((current) => Math.max(current ?? 0, result.count));
          }
        }).catch(() => {});
    }

    if (!requested.current) {
      requested.current = true;
      record();
    }
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) record();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return <div>
    <strong>{count?.toLocaleString(english ? "en" : "zh-CN") ?? "—"}</strong>
    <span>{english ? "Total views" : "总浏览量"}</span>
  </div>;
}
