"use client";

import { FormEvent, useState } from "react";

type SetupFormValues = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  deepseekApiKey: string;
  dashscopeApiKey: string;
  youtubeApiKey: string;
};

const emptyValues: SetupFormValues = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  supabaseServiceRoleKey: "",
  deepseekApiKey: "",
  dashscopeApiKey: "",
  youtubeApiKey: "",
};

const fields: Array<{
  key: keyof SetupFormValues;
  label: string;
  hint: string;
  type: "text" | "password" | "url";
}> = [
  { key: "supabaseUrl", label: "Supabase Project URL", hint: "Project Settings → API → Project URL", type: "url" },
  { key: "supabaseAnonKey", label: "Supabase Publishable / anon key", hint: "Project Settings → API → Publishable key 或 anon key", type: "password" },
  { key: "supabaseServiceRoleKey", label: "Supabase service_role key", hint: "Project Settings → API → service_role（仅保存在本机）", type: "password" },
  { key: "deepseekApiKey", label: "DeepSeek API Key", hint: "DeepSeek 开放平台 → API Keys", type: "password" },
  { key: "dashscopeApiKey", label: "百炼 DashScope API Key", hint: "百炼控制台 → API Key", type: "password" },
  { key: "youtubeApiKey", label: "YouTube Data API v3 Key", hint: "Google Cloud → APIs & Services → Credentials", type: "password" },
];

export function LocalSetupForm() {
  const [values, setValues] = useState(emptyValues);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setMessage("");

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "保存失败，请稍后重试。");

      setValues(emptyValues);
      setState("saved");
      setMessage("已安全写入本机 .env.local。请回到终端重启应用，连接状态才会更新。");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    }
  }

  return (
    <form className="setup-form" onSubmit={submit}>
      <div className="setup-security-note">
        <strong>本机私有保存</strong>
        <p>提交内容只发送到当前电脑的 localhost 并写入 `.env.local`。密钥不会显示在页面上，不会写入 Git，也不会保存到浏览器。</p>
      </div>

      {fields.map((field) => (
        <label className="setup-field" key={field.key}>
          <span>{field.label}</span>
          <small>{field.hint}</small>
          <input
            autoComplete="off"
            required
            type={field.type}
            value={values[field.key]}
            onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
          />
        </label>
      ))}

      <button className="setup-submit" disabled={state === "saving"} type="submit">
        {state === "saving" ? "正在保存…" : "保存到本机并继续"}
      </button>
      {message && <p aria-live="polite" className={`setup-message ${state}`}>{message}</p>}
    </form>
  );
}
