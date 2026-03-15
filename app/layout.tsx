import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corneal Risk Platform",
  description: "Clinical decision support interface for structured corneal graft follow-up"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
