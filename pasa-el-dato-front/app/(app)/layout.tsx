import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { FloatingChat } from "@/components/layout/FloatingChat";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex flex-1 flex-col">{children}</div>
      <FloatingChat />
      <Footer />
    </>
  );
}
