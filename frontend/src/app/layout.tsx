import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FinancialDataProvider } from "@/context/FinancialDataContext";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestio V4",
  description: "Finance Manager",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
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
          <Toaster />
        </FinancialDataProvider>
      </body>
    </html>
  );
}
