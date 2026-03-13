import Link from "next/link";
import AdminAnalyticsDashboard from "@/components/admin-analytics-dashboard";

export default function AdminAnalyticsDashboardPage() {
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
            Analytics Dashboard
          </h1>

          <p
            style={{
              margin: "10px 0 0 0",
              color: "#475569",
              maxWidth: "980px",
              lineHeight: 1.6
            }}
          >
            Monitor content pipeline, contributor approvals, competency coverage,
            and learner performance.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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
            Taxonomy
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

      <AdminAnalyticsDashboard />
    </main>
  );
}