import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Devuélvemelo",
  description: "Reclama lo que te deben, sin el drama.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Devuélvemelo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Evita el auto-zoom de iOS al enfocar inputs
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
