"use client";

import { useSyncExternalStore } from "react";
import type { KnowledgeItem } from "@/lib/types";

export type Locale = "zh" | "en";
const KEY = "frontier-radar-card-language-v1";
const EVENT = "frontier-language-change";
let fallback: Locale = "zh";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function read(): Locale {
  try { return localStorage.getItem(KEY) === "en" ? "en" : "zh"; } catch { return fallback; }
}

export function useReadingLanguage() {
  return useSyncExternalStore<Locale>(subscribe, read, () => "zh");
}

export function setReadingLanguage(locale: Locale) {
  fallback = locale;
  try { localStorage.setItem(KEY, locale); } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function hasCompleteEnglish(item: KnowledgeItem) {
  const english = item.english;
  return Boolean(english?.summary.trim() && english.claims.length === (item.claims?.length ?? 0)
    && (item.claims ?? []).every((claim) => english.claims.some((entry) => entry.id === claim.id)));
}
