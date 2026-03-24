import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FinancialDataProvider } from "@/context/FinancialDataContext";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestio V4",
  description: "Finance Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <FinancialDataProvider>
          <AppShell>{children}</AppShell>
        </FinancialDataProvider>
      </body>
    </html>
  );
}
