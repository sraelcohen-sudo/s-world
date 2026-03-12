"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ApprovedSubmission = {
  id: string;
  author_name: string | null;
  author_email: string | null;
  approved_at: string | null;
  question_id: string;
};

export default function ContributorRewardsClient() {
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submissions, setSubmissions] = useState<ApprovedSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    setLoading(true);
    setError("");
    setSearched(true);

    const cleanEmail = authorEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Enter a valid contributor email.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("question_submissions")
      .select("id, author_name, author_email, approved_at, question_id")
      .eq("author_email", cleanEmail)
      .eq("status", "approved")
      .not("approved_at", "is", null)
      .order("approved_at", { ascending: false });

    if (error) {
      setError(error.message);
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const loaded = (data ?? []) as ApprovedSubmission[];
    setSubmissions(loaded);

    if (!authorName.trim() && loaded.length > 0 && loaded[0].author_name) {
      setAuthorName(loaded[0].author_name ?? "");
    }

    setLoading(false);
  }

  const currentMonthKey = new Date().toISOString().slice(0, 7);

  const currentMonthApprovals = useMemo(() => {
    return submissions.filter((submission) => {
      if (!submission.approved_at) return false;
      return submission.approved_at.slice(0, 7) === currentMonthKey;
    });
  }, [submissions, currentMonthKey]);

  const eligible = currentMonthApprovals.length >= 2;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "820px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#0f2d69" }}>
          Check Reward Eligibility
        </h2>

        <label style={labelStyle}>Contributor Name</label>
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Dr. Jane Smith"
          style={inputStyle}
        />

        <label style={labelStyle}>Contributor Email</label>
        <input
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          placeholder="jane@example.com"
          style={inputStyle}
        />

        <button onClick={handleSearch} disabled={loading} style={primaryButtonStyle}>
          {loading ? "Checking..." : "Check This Month"}
        </button>

        {error ? <p style={errorStyle}>{error}</p> : null}
      </section>

      {searched && !loading ? (
        <>
          <section
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "820px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#0f2d69" }}>
              Monthly Reward Status
            </h2>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <span style={summaryPillStyle}>Month: {currentMonthKey}</span>
              <span style={summaryPillStyle}>
                Approved This Month: {currentMonthApprovals.length}
              </span>
              <span
                style={{
                  ...summaryPillStyle,
                  backgroundColor: eligible ? "#dcfce7" : "#fee2e2",
                  color: eligible ? "#166534" : "#b91c1c"
                }}
              >
                {eligible ? "Eligible for Free Month" : "Not Yet Eligible"}
              </span>
            </div>

            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Rule: 2 approved questions in the same month = 1 free membership month.
            </p>
          </section>

          <section
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#0f2d69" }}>
              Approved Questions
            </h2>

            {submissions.length === 0 ? (
              <p style={{ color: "#475569" }}>No approved questions found for this contributor.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {submissions.map((submission) => (
                  <article
                    key={submission.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "14px"
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        color: "#64748b",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      Approved
                    </p>

                    <p style={{ margin: "0 0 8px 0", color: "#0f172a", fontWeight: 700 }}>
                      Question ID: {submission.question_id}
                    </p>

                    <p style={{ margin: 0, color: "#475569" }}>
                      Approved At: {submission.approved_at || "Unknown"}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "8px"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
  marginBottom: "16px",
  backgroundColor: "#fff"
};

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: "#0f2d69",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer"
};

const summaryPillStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: 700,
  backgroundColor: "#eff6ff",
  color: "#1d4ed8"
};

const errorStyle: React.CSSProperties = {
  marginTop: "16px",
  color: "#b91c1c",
  fontWeight: 700
};