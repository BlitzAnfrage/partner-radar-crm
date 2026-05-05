import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Partner Radar CRM",
  description: "Private CRM dashboard for Saarland business leads"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
