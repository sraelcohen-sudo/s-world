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
          backgroundColor: "#f5f7fb"
        }}
      >
        {children}
      </body>
    </html>
  );
}