export const metadata = {
  title: "S World",
  description: "Competency-based healthcare learning platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#f5f7fb" }}>
        {children}
      </body>
    </html>
  );
}