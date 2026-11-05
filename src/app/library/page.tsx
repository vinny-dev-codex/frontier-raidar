import type { Metadata } from "next";
import { LiveLibrary } from "@/components/live-library";

export const metadata: Metadata = { title: "知识库" };

export default function LibraryPage() {
  return <LiveLibrary />;
}
