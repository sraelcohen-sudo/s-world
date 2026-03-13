import Link from "next/link";
import AdminBlueprintsDashboard from "@/components/admin-blueprints-client";

export default function AdminBlueprintsDashboardPage() {
  return (
    <main
      style={{
        padding: "40px",
        minHeight: "100vh",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap"
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 8px 0",
              color: "#64748b",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontSize: "12px"
            }}
          >
            Admin
          </p>

          <h1
            style={{
              margin: 0,
              color: "#0f2d69",
              fontSize: "36px"
            }}
          >
            Blueprint Dashboard
          </h1>

          <p
            style={{
              margin: "10px 0 0 0",
              color: "#475569",
              maxWidth: "820px",
              lineHeight: 1.6
            }}
          >
            Define how each discipline is weighted across competencies. These
            blueprint percentages will later drive practice block generation and
            balanced exam simulation.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap"
          }}
        >
          <Link
            href="/admin/competencies"
            style={{
              backgroundColor: "#ffffff",
              color: "#0f2d69",
              textDecoration: "none",
              borderRadius: "10px",
              padding: "12px 16px",
              fontWeight: 700,
              border: "1px solid #cbd5e1"
            }}
          >
            Competencies
          </Link>

          <Link
            href="/admin/disciplines"
            style={{
              backgroundColor: "#ffffff",
              color: "#0f2d69",
              textDecoration: "none",
              borderRadius: "10px",
              padding: "12px 16px",
              fontWeight: 700,
              border: "1px solid #cbd5e1"
            }}
          >
            Disciplines
          </Link>

          <Link
            href="/admin/taxonomy"
            style={{
              backgroundColor: "#ffffff",
              color: "#0f2d69",
              textDecoration: "none",
              borderRadius: "10px",
              padding: "12px 16px",
              fontWeight: 700,
              border: "1px solid #cbd5e1"
            }}
          >
            Exam Tracks
          </Link>

          <Link
            href="/"
            style={{
              backgroundColor: "#ffffff",
              color: "#0f2d69",
              textDecoration: "none",
              borderRadius: "10px",
              padding: "12px 16px",
              fontWeight: 700,
              border: "1px solid #cbd5e1"
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>

      <AdminBlueprintsDashboard />
    </main>
  );
}