export const metadata = {
  title: "Finance and Investment Tracker",
  description: "Trial web app for finance and investment tracking",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#f3f4f6" }}>
        {children}
      </body>
    </html>
  );
}
