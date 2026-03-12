export default function HomePage() {
  return (
    <main style={{ padding: "48px" }}>
      <h1 style={{ marginBottom: "12px", color: "#0f2d69" }}>S World</h1>
      <p style={{ fontSize: "18px", color: "#334155" }}>
        Competency-based healthcare learning platform
      </p>

      <div style={{ marginTop: "32px", padding: "24px", background: "#fff", borderRadius: "12px", maxWidth: "700px" }}>
        <h2>Framework status</h2>
        <p>GitHub repository connected. Next steps: Supabase schema, auth, and Vercel deployment.</p>
      </div>
    </main>
  );
}