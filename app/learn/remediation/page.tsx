import Link from "next/link";
import LearnerRemediationDashboard from "@/components/learner-remediation-client";

export default function LearnerRemediationDashboardPage() {
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
            Learner Portal
          </p>

          <h1
            style={{
              margin: 0,
              color: "#7c2d12",
              fontSize: "36px"
            }}
          >
            Remediation Mode
          </h1>

          <p
            style={{
              margin: "10px 0 0 0",
              color: "#475569",
              maxWidth: "920px",
              lineHeight: 1.6
            }}
          >
            Build a focused deck from competencies that are currently below threshold.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/learn/practice"
            style={{
              backgroundColor: "#ffffff",
              color: "#7c2d12",
              textDecoration: "none",
              borderRadius: "10px",
              padding: "12px 16px",
              fontWeight: 700,
              border: "1px solid #fed7aa"
            }}
          >
            Practice Block
          </Link>

          <Link
            href="/learn/progress"
            style={{
              backgroundColor: "#ffffff",
              color: "#7c2d12",
              textDecoration: "none",
              borderRadius: "10px",
              padding: "12px 16px",
              fontWeight: 700,
              border: "1px solid #fed7aa"
            }}
          >
            Competency Progress
          </Link>

          <Link
            href="/"
            style={{
              backgroundColor: "#ffffff",
              color: "#7c2d12",
              textDecoration: "none",
              borderRadius: "10px",
              padding: "12px 16px",
              fontWeight: 700,
              border: "1px solid #fed7aa"
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>

      <LearnerRemediationDashboard />
    </main>
  );
}