"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "今日" },
  { href: "/library", label: "知识库" },
  { href: "/sources", label: "来源" },
  { href: "/settings", label: "设置" },
  { href: "/login", label: "登录" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="主导航" className="main-nav">
      {navItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return <Link aria-current={active ? "page" : undefined} className={active ? "active" : undefined} href={item.href} key={item.href}>{item.label}</Link>;
      })}
    </nav>
  );
}
