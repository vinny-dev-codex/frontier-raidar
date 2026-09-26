import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "登录" };

export default function LoginPage() {
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">PERSONAL ACCESS</p>
        <h1>登录你的知识库</h1>
        <p>登录后，真实发现内容、阅读状态和搜索结果只属于你的个人账户。</p>
      </section>
      <AuthForm />
    </>
  );
}
