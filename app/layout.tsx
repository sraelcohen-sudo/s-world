import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "S World",
  description: "Competency-based healthcare learning platform"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
          backgroundColor: "#eef2f7",
          color: "#0f172a"
        }}
      >
        {children}
      </body>
    </html>
  );
}