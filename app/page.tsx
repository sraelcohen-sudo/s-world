import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        padding: "48px",
        minHeight: "100vh",
        boxSizing: "border-box"
      }}
    >
      <h1
        style={{
          margin: "0 0 12px 0",
          color: "#0f2d69",
          fontSize: "40px"
        }}
      >
        S World
      </h1>

      <p
        style={{
          fontSize: "18px",
          color: "#334155",
          marginBottom: "32px"
        }}
      >
        Competency-based healthcare learning platform
      </p>

      <section
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "760px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#0f172a"
          }}
        >
          Framework status
        </h2>

        <p style={{ color: "#475569", lineHeight: 1.6 }}>
          GitHub connected, Vercel deployed, Supabase schema loaded.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "20px"
          }}
        >
          <Link
            href="/admin/taxonomy"
            style={{
              backgroundColor: "#0f2d69",
              color: "#ffffff",
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: "10px",
              fontWeight: 700
            }}
          >
            Open Taxonomy Admin
          </Link>
        </div>
      </section>
    </main>
  );
}