"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { NavLinks } from "./nav-links";
import { useReadingLanguage } from "./reading-language";
import { VisitorCounter } from "./visitor-count";

export function AppShell({ children }: { children: ReactNode }) {
  const english = useReadingLanguage() === "en";
  return (
    <VisitorCounter><div className="app-shell">
      <header className="site-header">
        <div>
          <Link className="brand" href="/">
            Frontier Radar
          </Link>
        </div>
        <NavLinks />
      </header>
      <main className="page-container">{children}</main>
      <footer className="site-footer" lang={english ? "en" : "zh-CN"}>
        {english ? "Cards are produced only when verifiable source text is available." : "只分析可验证原文。没有字幕或正文时，不生成内容。"}
      </footer>
    </div></VisitorCounter>
  );
}
