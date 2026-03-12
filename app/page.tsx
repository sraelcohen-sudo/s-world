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
          maxWidth: "1080px",
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
          Taxonomy, visibility controls, question authoring, review workflow, learner practice, and competency progress tracking are now active.
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
            Taxonomy Admin
          </Link>

          <Link
            href="/admin/disciplines"
            style={{
              backgroundColor: "#0f2d69",
              color: "#ffffff",
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: "10px",
              fontWeight: 700
            }}
          >
            Disciplines
          </Link>

          <Link
            href="/admin/competencies"
            style={{
              backgroundColor: "#0f2d69",
              color: "#ffffff",
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: "10px",
              fontWeight: 700
            }}
          >
            Competencies
          </Link>

          <Link
            href="/admin/blueprints"
            style={{
              backgroundColor: "#0f2d69",
              color: "#ffffff",
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: "10px",
              fontWeight: 700
            }}
          >
            Blueprints
          </Link>

          <Link
            href="/author/questions"
            style={{
              backgroundColor: "#ffffff",
              color: "#0f2d69",
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: "10px",
              fontWeight: 700,
              border: "1px solid #cbd5e1"
            }}
          >
            Question Authoring
          </Link>

          <Link
            href="/reviewer/queue"
            style={{
              backgroundColor: "#ffffff",
              color: "#0f2d69",
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: "10px",
              fontWeight: 700,
              border: "1px solid #cbd5e1"
            }}
          >
            Review Queue
          </Link>

          <Link
            href="/learn/practice"
            style={{
              backgroundColor: "#ffffff",
              color: "#0f2d69",
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: "10px",
              fontWeight: 700,
              border: "1px solid #cbd5e1"
            }}
          >
            Practice Block
          </Link>

          <Link
            href="/learn/progress"
            style={{
              backgroundColor: "#ffffff",
              color: "#0f2d69",
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: "10px",
              fontWeight: 700,
              border: "1px solid #cbd5e1"
            }}
          >
            Competency Progress
          </Link>
        </div>
      </section>
    </main>
  );
}