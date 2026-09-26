"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPublicSupabaseClient } from "@/lib/supabase";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "signed-in" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const client = createPublicSupabaseClient();
    if (!client) {
      setStatus("error");
      setMessage("Supabase 尚未配置。请先在本机连接设置页填写服务信息。");
      return;
    }

    client.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus("signed-in");
        setMessage("你已登录。现在可以开始建立个人真实知识库。");
      }
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setStatus("signed-in");
        setMessage("登录已完成。现在可以开始建立个人真实知识库。");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function requestMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createPublicSupabaseClient();
    if (!client) return;

    setStatus("sending");
    setMessage("");
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage("登录链接已发送。请在邮箱中打开它，然后回到此页面。链接只用于你的个人知识库。 ");
  }

  if (status === "signed-in") {
    return (
      <section className="auth-card" aria-live="polite">
        <h2>登录完成</h2>
        <p>{message}</p>
        <Link className="setup-link" href="/">返回今日页面</Link>
      </section>
    );
  }

  return (
    <form className="auth-card auth-form" onSubmit={requestMagicLink}>
      <label className="setup-field" htmlFor="email">
        你的邮箱
        <small>我们会发送一次性登录链接，不需要设置或保存密码。</small>
        <input
          autoComplete="email"
          id="email"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </label>
      <button className="setup-submit" disabled={status === "sending"} type="submit">
        {status === "sending" ? "正在发送…" : "发送登录链接"}
      </button>
      {message ? <p className={`setup-message ${status}`} role="status">{message}</p> : null}
    </form>
  );
}
