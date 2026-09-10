import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Pasa el Dato",
  description: "Frontend Pasa el Dato — Next.js 16 + Tailwind v4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-navy font-sans">
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
