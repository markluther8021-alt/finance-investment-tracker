import "./globals.css";

export const metadata = {
  title: "Finance Investment Tracker",
  description: "Investment module",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
