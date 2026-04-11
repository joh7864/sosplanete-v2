import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOS Planète - Challenge Énergétique",
  description: "Réduisons ensemble notre impact environnemental",
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/logo-sosplanete.png',
    apple: '/icons/logo-sosplanete.png',
  },
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
