"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Competency, Discipline, ExamTrack, Question } from "@/types/database";

type Submission = {
  id: string;
  status: "draft" | "submitted" | "under_review" | "needs_revision" | "approved" | "rejected";
  author_name: string | null;
  author_email: string | null;
  approved_at: string | null;
  question_id: string;
};

type QuestionJoin = {
  id: string;
  exam_track_id: string | null;
  discipline_id: string | null;
  competency_id: string | null;
};

type RawSessionQuestion = {
  id: string;
  is_correct: boolean | null;
  questions: QuestionJoin | QuestionJoin[] | null;
};

type NormalizedSessionQuestion = {
  id: string;
  is_correct: boolean | null;
  question: QuestionJoin | null;
};

export default function AdminAnalyticsClient() {
  const [tracks, setTracks] = useState<ExamTrack[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<NormalizedSessionQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");

    const [
      tracksResult,
      disciplinesResult,
      competenciesResult,
      questionsResult,
      submissionsResult,
      sessionQuestionsResult
    ] = await Promise.all([
      supabase.from("exam_tracks").select("*").order("name", { ascending: true }),
      supabase.from("disciplines").select("*").order("name", { ascending: true }),
      supabase.from("competencies").select("*").order("name", { ascending: true }),
      supabase.from("questions").select("*").order("created_at", { ascending: false }),
      supabase
        .from("question_submissions")
        .select("id, status, author_name, author_email, approved_at, question_id")
        .order("submitted_at", { ascending: false }),
      supabase
        .from("session_questions")
        .select(
          `
            id,
            is_correct,
            questions (
              id,
              exam_track_id,
              discipline_id,
              competency_id
            )
          `
        )
        .not("is_correct", "is", null)
    ]);

    if (tracksResult.error) {
      setError(tracksResult.error.message);
      setLoading(false);
      return;
    }

    if (disciplinesResult.error) {
      setError(disciplinesResult.error.message);
      setLoading(false);
      return;
    }

    if (competenciesResult.error) {
      setError(competenciesResult.error.message);
      setLoading(false);
      return;
    }

    if (questionsResult.error) {
      setError(questionsResult.error.message);
      setLoading(false);
      return;
    }

    if (submissionsResult.error) {
      setError(submissionsResult.error.message);
      setLoading(false);
      return;
    }

    if (sessionQuestionsResult.error) {
      setError(sessionQuestionsResult.error.message);
      setLoading(false);
      return;
    }

    const rawSessionQuestions = ((sessionQuestionsResult.data ?? []) as unknown[]) as RawSessionQuestion[];

    const normalizedSessionQuestions: NormalizedSessionQuestion[] = rawSessionQuestions.map((row) => {
      const question = Array.isArray(row.questions) ? row.questions[0] ?? null : row.questions ?? null;

      return {
        id: row.id,
        is_correct: row.is_correct,
        question
      };
    });

    setTracks((tracksResult.data ?? []) as ExamTrack[]);
    setDisciplines((disciplinesResult.data ?? []) as Discipline[]);
    setCompetencies((competenciesResult.data ?? []) as Competency[]);
    setQuestions((questionsResult.data ?? []) as Question[]);
    setSubmissions((submissionsResult.data ?? []) as Submission[]);
    setSessionQuestions(normalizedSessionQuestions);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const questionStats = useMemo(() => {
    const total = questions.length;
    const submitted = questions.filter((q) => q.status === "submitted").length;
    const underReview = questions.filter((q) => q.status === "under_review").length;
    const needsRevision = questions.filter((q) => q.status === "needs_revision").length;
    const approved = questions.filter((q) => q.status === "approved").length;
    const rejected = questions.filter((q) => q.status === "rejected").length;

    return {
      total,
      submitted,
      underReview,
      needsRevision,
      approved,
      rejected
    };
  }, [questions]);

  const competencyCoverage = useMemo(() => {
    return competencies
      .map((competency) => {
        const approvedCount = questions.filter(
          (question) =>
            question.status === "approved" && question.competency_id === competency.id
        ).length;

        return {
          competencyId: competency.id,
          competencyName: competency.name,
          approvedCount,
          thresholdPercent: competency.threshold_percent,
          minimumQuestions: competency.minimum_questions
        };
      })
      .sort((a, b) => a.approvedCount - b.approvedCount);
  }, [competencies, questions]);

  const contributorApprovals = useMemo(() => {
    const approvedOnly = submissions.filter((submission) => submission.status === "approved");

    const map = new Map<
      string,
      {
        name: string;
        email: string;
        approvedCount: number;
      }
    >();

    approvedOnly.forEach((submission) => {
      const email = submission.author_email?.trim().toLowerCase() || "unknown";
      const name = submission.author_name?.trim() || "Unknown contributor";

      const current = map.get(email);

      if (current) {
        current.approvedCount += 1;
      } else {
        map.set(email, {
          name,
          email,
          approvedCount: 1
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.approvedCount - a.approvedCount);
  }, [submissions]);

  const learnerPerformanceByCompetency = useMemo(() => {
    return competencies
      .map((competency) => {
        const relatedAnswers = sessionQuestions.filter(
          (row) => row.question?.competency_id === competency.id
        );

        const attempted = relatedAnswers.length;
        const correct = relatedAnswers.filter((row) => row.is_correct === true).length;
        const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

        return {
          competencyName: competency.name,
          attempted,
          correct,
          accuracy
        };
      })
      .filter((row) => row.attempted > 0)
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [competencies, sessionQuestions]);

  const activeTracks = useMemo(() => tracks.filter((track) => track.active).length, [tracks]);

  const hiddenTracks = useMemo(() => tracks.filter((track) => !track.active).length, [tracks]);

  if (loading) {
    return (
      <section
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}
      >
        <p style={{ margin: 0, color: "#475569" }}>Loading analytics...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}
      >
        <p style={{ margin: 0, color: "#b91c1c", fontWeight: 700 }}>{error}</p>
      </section>
    );
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px"
        }}
      >
        <StatCard label="Total Questions" value={questionStats.total} />
        <StatCard label="Submitted" value={questionStats.submitted} />
        <StatCard label="Under Review" value={questionStats.underReview} />
        <StatCard label="Needs Revision" value={questionStats.needsRevision} />
        <StatCard label="Approved" value={questionStats.approved} />
        <StatCard label="Rejected" value={questionStats.rejected} />
        <StatCard label="Visible Exams" value={activeTracks} />
        <StatCard label="Hidden Exams" value={hiddenTracks} />
      </section>

      <section
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}
      >
        <SectionHeader title="Approved Questions by Competency" onRefresh={loadAll} />

        {competencyCoverage.length === 0 ? (
          <p style={{ color: "#475569" }}>No competency data available.</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {competencyCoverage.slice(0, 20).map((row) => (
              <article
                key={row.competencyId}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "14px"
                }}
              >
                <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#0f172a" }}>
                  {row.competencyName}
                </h3>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Pill text={`Approved Questions: ${row.approvedCount}`} />
                  <Pill text={`Threshold: ${row.thresholdPercent}%`} />
                  <Pill text={`Minimum Questions: ${row.minimumQuestions}`} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}
      >
        <SectionHeader title="Contributor Approval Counts" onRefresh={loadAll} />

        {contributorApprovals.length === 0 ? (
          <p style={{ color: "#475569" }}>No approved contributors yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {contributorApprovals.map((row) => (
              <article
                key={row.email}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "14px"
                }}
              >
                <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#0f172a" }}>
                  {row.name}
                </h3>
                <p style={{ margin: "0 0 8px 0", color: "#475569" }}>{row.email}</p>
                <Pill text={`Approved Questions: ${row.approvedCount}`} />
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}
      >
        <SectionHeader title="Learner Performance by Competency" onRefresh={loadAll} />

        {learnerPerformanceByCompetency.length === 0 ? (
          <p style={{ color: "#475569" }}>No learner performance data yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {learnerPerformanceByCompetency.slice(0, 20).map((row) => (
              <article
                key={row.competencyName}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "14px"
                }}
              >
                <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#0f172a" }}>
                  {row.competencyName}
                </h3>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Pill text={`Attempted: ${row.attempted}`} />
                  <Pill text={`Correct: ${row.correct}`} />
                  <Pill text={`Accuracy: ${row.accuracy}%`} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
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
        {label}
      </p>
      <h2 style={{ margin: 0, color: "#0f172a", fontSize: "32px" }}>{value}</h2>
    </article>
  );
}

function SectionHeader({
  title,
  onRefresh
}: {
  title: string;
  onRefresh: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        gap: "12px",
        flexWrap: "wrap"
      }}
    >
      <h2 style={{ margin: 0, color: "#0f2d69" }}>{title}</h2>

      <button
        onClick={onRefresh}
        style={{
          backgroundColor: "#e2e8f0",
          color: "#0f172a",
          border: "none",
          borderRadius: "10px",
          padding: "10px 14px",
          fontWeight: 700,
          cursor: "pointer"
        }}
      >
        Refresh
      </button>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span
      style={{
        backgroundColor: "#eff6ff",
        color: "#1d4ed8",
        borderRadius: "999px",
        padding: "8px 12px",
        fontSize: "12px",
        fontWeight: 700
      }}
    >
      {text}
    </span>
  );
}