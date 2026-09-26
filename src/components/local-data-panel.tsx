"use client";

import { useState } from "react";

const KEY = "frontier-radar-reading-state-v1";

export function LocalDataPanel() {
  const [message, setMessage] = useState("");

  function exportData() {
    const body = localStorage.getItem(KEY) ?? "{}";
    const blob = new Blob([body], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `frontier-radar-reading-state-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("阅读状态已导出。知识内容本身不在浏览器本地重复存储。");
  }

  function clearData() {
    if (!window.confirm("确定清除当前设备上的收藏和已读状态吗？")) return;
    localStorage.removeItem(KEY);
    setMessage("本地阅读状态已清除。");
  }

  return (
    <div className="local-data-actions">
      <button onClick={exportData} type="button">导出阅读状态</button>
      <button className="button-secondary" onClick={clearData} type="button">清除本地状态</button>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
