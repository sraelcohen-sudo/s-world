import Link from "next/link";
import LearnerProgressClient from "@/components/learner-progress-client";

export default function LearnProgressPage() {
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
              color: "#0f2d69",
              fontSize: "36px"
            }}
          >
            Competency Progress
          </h1>
          <p
            style={{
              margin: "10px 0 0 0",
              color: "#475569",
              maxWidth: "900px",
              lineHeight: 1.6
            }}
          >
            Track whether the learner is meeting the threshold for each competency.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/learn/practice"
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
            Practice Block
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

      <LearnerProgressClient />
    </main>
  );
}