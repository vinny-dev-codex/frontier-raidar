"use client";

import { useSyncExternalStore } from "react";

type ReadingState = { saved: boolean; read: boolean };
const KEY = "frontier-radar-reading-state-v1";

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, ReadingState>;
  } catch {
    return {};
  }
}

export function ReadingActions({ itemId, locale = "zh" }: { itemId: string; locale?: "zh" | "en" }) {
  const snapshot = useSyncExternalStore(
    (callback) => {
      window.addEventListener("frontier-reading-state", callback);
      window.addEventListener("storage", callback);
      return () => {
        window.removeEventListener("frontier-reading-state", callback);
        window.removeEventListener("storage", callback);
      };
    },
    () => JSON.stringify(loadAll()[itemId] ?? { saved: false, read: false }),
    () => JSON.stringify({ saved: false, read: false }),
  );
  const state = JSON.parse(snapshot) as ReadingState;

  function update(next: ReadingState) {
    const all = loadAll();
    all[itemId] = next;
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("frontier-reading-state"));
  }

  return (
    <div className="reading-actions" aria-label={locale === "en" ? "Reading actions" : "阅读操作"}>
      <button aria-pressed={state.saved} onClick={() => update({ ...state, saved: !state.saved })} type="button">
        {locale === "en" ? (state.saved ? "Saved" : "Save") : (state.saved ? "已收藏" : "收藏")}
      </button>
      <button aria-pressed={state.read} onClick={() => update({ ...state, read: !state.read })} type="button">
        {locale === "en" ? (state.read ? "Read" : "Mark as read") : (state.read ? "已读" : "标记已读")}
      </button>
      <small>{locale === "en" ? "Stored on this device only" : "状态仅保存在当前设备"}</small>
    </div>
  );
}
