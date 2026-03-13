import Link from "next/link";
import AuthorQuestionSubmissionDashboard from "@/components/question-author-client";

export default function AuthorQuestionSubmissionPage() {
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
            Author Portal
          </p>

          <h1
            style={{
              margin: 0,
              color: "#0f2d69",
              fontSize: "36px"
            }}
          >
            Question Submission
          </h1>

          <p
            style={{
              margin: "10px 0 0 0",
              color: "#475569",
              maxWidth: "840px",
              lineHeight: 1.6
            }}
          >
            Create exam-ready questions, classify them by taxonomy, and submit
            them for review.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/author/rewards"
            style={{
              backgroundColor: "#0f2d69",
              color: "#ffffff",
              textDecoration: "none",
              borderRadius: "10px",
              padding: "12px 16px",
              fontWeight: 700
            }}
          >
            Rewards
          </Link>

          <Link
            href="/admin/blueprints"
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
            Blueprints
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

      <AuthorQuestionSubmissionDashboard />
    </main>
  );
}