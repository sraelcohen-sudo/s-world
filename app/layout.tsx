import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "S World",
    template: "%s | S World"
  },
  description: "Competency-based healthcare learning platform"
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
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