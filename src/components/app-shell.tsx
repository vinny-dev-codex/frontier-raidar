import Link from "next/link";
import type { ReactNode } from "react";
import { NavLinks } from "./nav-links";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div>
          <Link className="brand" href="/">
            Frontier Radar
          </Link>
          <p className="brand-subtitle">个人前沿信息库</p>
        </div>
        <NavLinks />
      </header>
      <main className="page-container">{children}</main>
      <footer className="site-footer">
        只分析可验证原文。没有字幕或正文时，不生成内容。
      </footer>
    </div>
  );
}
