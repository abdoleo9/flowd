import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Flowd — Gestion E-commerce Algérien",
  description: "Plateforme de gestion pour e-commerçants algériens",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-background text-white antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#161820",
              border: "1px solid #1e2028",
              color: "#f1f5f9",
            },
          }}
        />
      </body>
    </html>
  );
}
