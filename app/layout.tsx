import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { installTimeUppercase } from "@/lib/polyfills/time";
import ClientSetup from "./components/ClientSetup";

// Install on server during initial render so server-output matches client
installTimeUppercase();

export const metadata: Metadata = {
  title: "ORVION CRM",
  description: "ORVION GROUP CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ClientSetup />

        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={3000}
        />
      </body>
    </html>
  );
}