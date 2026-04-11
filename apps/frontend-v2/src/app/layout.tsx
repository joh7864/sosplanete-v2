import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOS Planète - Challenge Énergétique",
  description: "Réduisons ensemble notre impact environnemental",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased font-outfit">
        {children}
      </body>
    </html>
  );
}
