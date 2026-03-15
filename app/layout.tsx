import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corneal Risk Platform V2",
  description: "Clinical decision support platform for corneal graft rejection risk assessment"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
