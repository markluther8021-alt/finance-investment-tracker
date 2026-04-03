import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finance Investment Tracker",
  description: "Investment module",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
