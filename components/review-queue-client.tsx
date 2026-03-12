"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type SubmissionQuestion = {
  id: string;
  title: string | null;
  stem: string;
  lead_in: string | null;
  explanation: string;
  strategy_text: string | null;
  resources_text: string | null;
  info_text: string | null;
  difficulty: "easy" | "medium" | "hard";
  cognitive_level: "recall" | "application" | "clinical_reasoning";
  question_type: "MCQ" | "IMAGE" | "LAB_INTERPRETATION" | "CASE_SERIES";
  status:
    | "draft"
    | "submitted"
    | "under_review"
    | "needs_revision"
    | "approved"
    | "rejected"
    | "retired";
  exam_track_id: string | null;
  discipline_id: string | null;
  competency_id: string | null;
  subtopic_id: string | null;
  created_at: string;
  updated_at: string;
};

type RawSubmissionListItem = {
  id: string;
  question_id: string;
  status: "draft" | "submitted" | "under_review" | "needs_revision" | "approved" | "rejected";
  submitted_at: string;
  reviewer_notes: string | null;
  internal_notes: string | null;
  author_name: string | null;
  author_email: string | null;
  approved_at: string | null;
  questions: SubmissionQuestion[] | SubmissionQuestion | null;
};

type SubmissionListItem = {
  id: string;
  question_id: string;
  status: "draft" | "submitted" | "under_review" | "needs_revision" | "approved" | "rejected";
  submitted_at: string;
  reviewer_notes: string | null;
  internal_notes: string | null;
  author_name: string | null;
  author_email: string | null;
  approved_at: string | null;
  questions: SubmissionQuestion | null;
};

type AnswerOption = {
  id: string;
  option_label: string;
  option_text: string;
  is_correct: boolean;
};

type QuestionReference = {
  id: string;
  source_title: string;
  source_author: string | null;
  source_year: number | null;
  source_link: string | null;
};

type ReviewDecision = "approve" | "request_revision" | "reject";

export default function ReviewQueueClient() {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [options, setOptions] = useState<AnswerOption[]>([]);
  const [references, setReferences] = useState<QuestionReference[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [clinicalAccuracy, setClinicalAccuracy] = useState("4");
  const [educationalQuality, setEducationalQuality] = useState("4");
  const [explanationQuality, setExplanationQuality] = useState("4");
  const [classificationAccuracy, setClassificationAccuracy] = useState("4");
  const [comments, setComments] = useState("");
  const [decision, setDecision] = useState<ReviewDecision>("approve");

  async function loadQueue() {
    setLoadingQueue(true);
    setError("");

    const { data, error } = await supabase
      .from("question_submissions")
      .select(
        `
          id,
          question_id,
          status,
          submitted_at,
          reviewer_notes,
          internal_notes,
          author_name,
          author_email,
          approved_at,
          questions (
            id,
            title,
            stem,
            lead_in,
            explanation,
            strategy_text,
            resources_text,
            info_text,
            difficulty,
            cognitive_level,
            question_type,
            status,
            exam_track_id,
            discipline_id,
            competency_id,
            subtopic_id,
            created_at,
            updated_at
          )
        `
      )
      .in("status", ["submitted", "under_review", "needs_revision"])
      .order("submitted_at", { ascending: true });

    if (error) {
      setError(error.message);
      setSubmissions([]);
      setLoadingQueue(false);
      return;
    }

    const raw = ((data ?? []) as unknown[]) as RawSubmissionListItem[];

    const loaded: SubmissionListItem[] = raw.map((submission) => {
      const question = Array.isArray(submission.questions)
        ? submission.questions[0] ?? null
        : submission.questions ?? null;

      return {
        ...submission,
        questions: question
      };
    });

    setSubmissions(loaded);

    if (!selectedSubmissionId && loaded.length > 0) {
      setSelectedSubmissionId(loaded[0].id);
    } else if (
      selectedSubmissionId &&
      !loaded.some((submission) => submission.id === selectedSubmissionId)
    ) {
      setSelectedSubmissionId(loaded.length > 0 ? loaded[0].id : "");
    }

    setLoadingQueue(false);
  }

  const selectedSubmission = useMemo(() => {
    return submissions.find((submission) => submission.id === selectedSubmissionId) || null;
  }, [submissions, selectedSubmissionId]);

  async function loadSelectedDetails(questionId: string) {
    setLoadingDetails(true);
    setError("");

    const [optionsResult, referencesResult] = await Promise.all([
      supabase
        .from("answer_options")
        .select("*")
        .eq("question_id", questionId)
        .order("option_label", { ascending: true }),
      supabase
        .from("question_references")
        .select("*")
        .eq("question_id", questionId)
        .order("source_title", { ascending: true })
    ]);

    if (optionsResult.error) {
      setError(optionsResult.error.message);
      setOptions([]);
      setReferences([]);
      setLoadingDetails(false);
      return;
    }

    if (referencesResult.error) {
      setError(referencesResult.error.message);
      setOptions([]);
      setReferences([]);
      setLoadingDetails(false);
      return;
    }

    setOptions((optionsResult.data ?? []) as AnswerOption[]);
    setReferences((referencesResult.data ?? []) as QuestionReference[]);
    setLoadingDetails(false);
  }

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    if (selectedSubmission?.question_id) {
      loadSelectedDetails(selectedSubmission.question_id);
    } else {
      setOptions([]);
      setReferences([]);
    }
  }, [selectedSubmission?.question_id]);

  async function markUnderReview() {
    if (!selectedSubmissionId) return;

    setMessage("");
    setError("");

    const { error } = await supabase
      .from("question_submissions")
      .update({ status: "under_review" })
      .eq("id", selectedSubmissionId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadQueue();
    setMessage("Submission marked as under review.");
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedSubmission || !selectedSubmission.questions) {
      setError("No submission selected.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const ca = Number(clinicalAccuracy);
    const eq = Number(educationalQuality);
    const exq = Number(explanationQuality);
    const clq = Number(classificationAccuracy);

    if (
      [ca, eq, exq, clq].some(
        (value) => Number.isNaN(value) || value < 1 || value > 5 || !Number.isInteger(value)
      )
    ) {
      setError("All rubric scores must be whole numbers from 1 to 5.");
      setSaving(false);
      return;
    }

    const reviewerId = crypto.randomUUID();

    const { error: reviewError } = await supabase.from("reviews").insert({
      question_id: selectedSubmission.question_id,
      reviewer_id: reviewerId,
      clinical_accuracy: ca,
      educational_quality: eq,
      explanation_quality: exq,
      classification_accuracy: clq,
      comments: comments.trim() || null,
      decision
    });

    if (reviewError) {
      setError(reviewError.message);
      setSaving(false);
      return;
    }

    const nextQuestionStatus =
      decision === "approve"
        ? "approved"
        : decision === "request_revision"
          ? "needs_revision"
          : "rejected";

    const nextSubmissionStatus =
      decision === "approve"
        ? "approved"
        : decision === "request_revision"
          ? "needs_revision"
          : "rejected";

    const { error: submissionError } = await supabase
      .from("question_submissions")
      .update({
        status: nextSubmissionStatus,
        reviewer_notes: comments.trim() || null,
        approved_at: decision === "approve" ? new Date().toISOString() : null
      })
      .eq("id", selectedSubmission.id);

    if (submissionError) {
      setError(submissionError.message);
      setSaving(false);
      return;
    }

    const { error: questionError } = await supabase
      .from("questions")
      .update({
        status: nextQuestionStatus
      })
      .eq("id", selectedSubmission.question_id);

    if (questionError) {
      setError(questionError.message);
      setSaving(false);
      return;
    }

    setClinicalAccuracy("4");
    setEducationalQuality("4");
    setExplanationQuality("4");
    setClassificationAccuracy("4");
    setComments("");
    setDecision("approve");

    await loadQueue();
    setSaving(false);
    setMessage("Review submitted successfully.");
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "380px 1fr",
        gap: "24px",
        alignItems: "start"
      }}
    >
      <section
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            gap: "12px"
          }}
        >
          <h2 style={{ margin: 0, color: "#0f2d69" }}>Review Queue</h2>

          <button
            onClick={loadQueue}
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

        {loadingQueue ? (
          <p style={{ color: "#475569" }}>Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <p style={{ color: "#475569" }}>No submissions waiting for review.</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {submissions.map((submission) => (
              <button
                key={submission.id}
                onClick={() => setSelectedSubmissionId(submission.id)}
                style={{
                  textAlign: "left",
                  width: "100%",
                  border:
                    submission.id === selectedSubmissionId
                      ? "2px solid #0f2d69"
                      : "1px solid #e2e8f0",
                  backgroundColor: submission.id === selectedSubmissionId ? "#eff6ff" : "#ffffff",
                  borderRadius: "12px",
                  padding: "14px",
                  cursor: "pointer"
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
                  {submission.status}
                </p>

                <h3
                  style={{
                    margin: "0 0 8px 0",
                    color: "#0f172a",
                    fontSize: "18px"
                  }}
                >
                  {submission.questions?.title || "Untitled question"}
                </h3>

                <p
                  style={{
                    margin: "0 0 8px 0",
                    color: "#475569",
                    lineHeight: 1.5
                  }}
                >
                  {submission.questions?.lead_in ||
                    submission.questions?.stem.slice(0, 120) ||
                    "No preview available."}
                </p>

                <p
                  style={{
                    margin: 0,
                    color: "#64748b",
                    fontSize: "13px"
                  }}
                >
                  {submission.author_name || "Unknown contributor"}
                  {submission.author_email ? ` • ${submission.author_email}` : ""}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          display: "grid",
          gap: "24px"
        }}
      >
        <section
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
          }}
        >
          {!selectedSubmission || !selectedSubmission.questions ? (
            <p style={{ color: "#475569", margin: 0 }}>Select a submission to review.</p>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "20px"
                }}
              >
                <div>
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
                    Question Review
                  </p>
                  <h2 style={{ margin: 0, color: "#0f2d69" }}>
                    {selectedSubmission.questions.title || "Untitled question"}
                  </h2>
                  <p style={{ margin: "8px 0 0 0", color: "#475569" }}>
                    Contributor: {selectedSubmission.author_name || "Unknown contributor"}
                    {selectedSubmission.author_email ? ` • ${selectedSubmission.author_email}` : ""}
                  </p>
                </div>

                <button
                  onClick={markUnderReview}
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
                  Mark Under Review
                </button>
              </div>

              <div style={{ display: "grid", gap: "18px" }}>
                <div>
                  <h3 style={sectionHeadingStyle}>Stem</h3>
                  <p style={bodyTextStyle}>{selectedSubmission.questions.stem}</p>
                </div>

                {selectedSubmission.questions.lead_in ? (
                  <div>
                    <h3 style={sectionHeadingStyle}>Lead-in</h3>
                    <p style={bodyTextStyle}>{selectedSubmission.questions.lead_in}</p>
                  </div>
                ) : null}

                <div>
                  <h3 style={sectionHeadingStyle}>Answer Options</h3>

                  {loadingDetails ? (
                    <p style={{ color: "#475569" }}>Loading question details...</p>
                  ) : options.length === 0 ? (
                    <p style={{ color: "#475569" }}>No answer options found.</p>
                  ) : (
                    <div style={{ display: "grid", gap: "10px" }}>
                      {options.map((option) => (
                        <div
                          key={option.id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "12px",
                            backgroundColor: option.is_correct ? "#f0fdf4" : "#ffffff"
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "12px",
                              alignItems: "start"
                            }}
                          >
                            <div>
                              <strong style={{ color: "#0f2d69" }}>{option.option_label}.</strong>{" "}
                              <span style={{ color: "#334155" }}>{option.option_text}</span>
                            </div>

                            {option.is_correct ? (
                              <span
                                style={{
                                  backgroundColor: "#dcfce7",
                                  color: "#166534",
                                  borderRadius: "999px",
                                  padding: "6px 10px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  whiteSpace: "nowrap"
                                }}
                              >
                                Correct
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={sectionHeadingStyle}>Explanation</h3>
                  <p style={bodyTextStyle}>{selectedSubmission.questions.explanation}</p>
                </div>

                {selectedSubmission.questions.strategy_text ? (
                  <div>
                    <h3 style={sectionHeadingStyle}>Strategy</h3>
                    <p style={bodyTextStyle}>{selectedSubmission.questions.strategy_text}</p>
                  </div>
                ) : null}

                {selectedSubmission.questions.resources_text ? (
                  <div>
                    <h3 style={sectionHeadingStyle}>Resources</h3>
                    <p style={bodyTextStyle}>{selectedSubmission.questions.resources_text}</p>
                  </div>
                ) : null}

                {selectedSubmission.questions.info_text ? (
                  <div>
                    <h3 style={sectionHeadingStyle}>Info</h3>
                    <p style={bodyTextStyle}>{selectedSubmission.questions.info_text}</p>
                  </div>
                ) : null}

                <div>
                  <h3 style={sectionHeadingStyle}>References</h3>

                  {loadingDetails ? (
                    <p style={{ color: "#475569" }}>Loading references...</p>
                  ) : references.length === 0 ? (
                    <p style={{ color: "#475569" }}>No references attached.</p>
                  ) : (
                    <div style={{ display: "grid", gap: "10px" }}>
                      {references.map((reference) => (
                        <div
                          key={reference.id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "12px"
                          }}
                        >
                          <strong style={{ color: "#0f172a" }}>{reference.source_title}</strong>
                          <p style={{ margin: "8px 0 0 0", color: "#475569" }}>
                            {[reference.source_author, reference.source_year]
                              .filter(Boolean)
                              .join(", ") || "No author/year provided."}
                          </p>
                          {reference.source_link ? (
                            <p style={{ margin: "8px 0 0 0", color: "#1d4ed8" }}>
                              {reference.source_link}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
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
          <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#0f2d69" }}>
            Review Rubric
          </h2>

          <form onSubmit={handleSubmitReview}>
            <label style={labelStyle}>Clinical Accuracy</label>
            <select
              value={clinicalAccuracy}
              onChange={(e) => setClinicalAccuracy(e.target.value)}
              style={inputStyle}
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Weak</option>
              <option value="3">3 - Adequate</option>
              <option value="4">4 - Strong</option>
              <option value="5">5 - Excellent</option>
            </select>

            <label style={labelStyle}>Educational Quality</label>
            <select
              value={educationalQuality}
              onChange={(e) => setEducationalQuality(e.target.value)}
              style={inputStyle}
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Weak</option>
              <option value="3">3 - Adequate</option>
              <option value="4">4 - Strong</option>
              <option value="5">5 - Excellent</option>
            </select>

            <label style={labelStyle}>Explanation Quality</label>
            <select
              value={explanationQuality}
              onChange={(e) => setExplanationQuality(e.target.value)}
              style={inputStyle}
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Weak</option>
              <option value="3">3 - Adequate</option>
              <option value="4">4 - Strong</option>
              <option value="5">5 - Excellent</option>
            </select>

            <label style={labelStyle}>Classification Accuracy</label>
            <select
              value={classificationAccuracy}
              onChange={(e) => setClassificationAccuracy(e.target.value)}
              style={inputStyle}
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Weak</option>
              <option value="3">3 - Adequate</option>
              <option value="4">4 - Strong</option>
              <option value="5">5 - Excellent</option>
            </select>

            <label style={labelStyle}>Decision</label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value as ReviewDecision)}
              style={inputStyle}
            >
              <option value="approve">Approve</option>
              <option value="request_revision">Request Revision</option>
              <option value="reject">Reject</option>
            </select>

            <label style={labelStyle}>Reviewer Comments</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={5}
              placeholder="Provide feedback for the author or note any issues."
              style={textareaStyle}
            />

            <button
              type="submit"
              disabled={saving || !selectedSubmission}
              style={{
                backgroundColor: saving || !selectedSubmission ? "#94a3b8" : "#0f2d69",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "12px 18px",
                fontWeight: 700,
                cursor: saving || !selectedSubmission ? "not-allowed" : "pointer"
              }}
            >
              {saving ? "Submitting Review..." : "Submit Review"}
            </button>
          </form>

          {message ? <p style={successStyle}>{message}</p> : null}
          {error ? <p style={errorStyle}>{error}</p> : null}
        </section>
      </section>
    </div>
  );
}

const sectionHeadingStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
  color: "#0f172a",
  fontSize: "18px"
};

const bodyTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap"
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "8px"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
  marginBottom: "16px",
  backgroundColor: "#fff"
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
  marginBottom: "16px",
  resize: "vertical"
};

const successStyle: React.CSSProperties = {
  marginTop: "16px",
  color: "#166534",
  fontWeight: 700
};

const errorStyle: React.CSSProperties = {
  marginTop: "16px",
  color: "#b91c1c",
  fontWeight: 700
};