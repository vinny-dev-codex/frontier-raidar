import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Frontier Radar", template: "%s · Frontier Radar" },
  description: "面向个人学习的前沿信息发现、证据提取与深度分析工具。",
  applicationName: "Frontier Radar",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN">
      <body>
        <ServiceWorkerRegistration />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
