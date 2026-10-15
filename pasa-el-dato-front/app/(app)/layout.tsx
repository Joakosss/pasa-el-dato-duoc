import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { FloatingChat } from "@/components/layout/FloatingChat";
import { FloatingPublish } from "@/components/layout/FloatingPublish";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex flex-1 flex-col">{children}</div>
      <FloatingPublish />
      <FloatingChat />
      <Footer />
    </>
  );
}
