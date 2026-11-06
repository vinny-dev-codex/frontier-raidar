"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReadingLanguage } from "./reading-language";

const navItems = [
  { href: "/", zh: "今日", en: "Today" },
  { href: "/library", zh: "知识库", en: "Library" },
  { href: "/sources", zh: "来源", en: "Sources" },
];

export function NavLinks() {
  const pathname = usePathname();
  const locale = useReadingLanguage();
  return (
    <nav aria-label={locale === "en" ? "Main navigation" : "主导航"} className="main-nav" lang={locale === "en" ? "en" : "zh-CN"}>
      {navItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return <Link aria-current={active ? "page" : undefined} className={active ? "active" : undefined} href={item.href} key={item.href}>{item[locale]}</Link>;
      })}
    </nav>
  );
}
