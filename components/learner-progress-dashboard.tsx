"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties
} from "react";
import { supabase } from "@/lib/supabase";
import type { Competency, Discipline, ExamTrack } from "@/types/database";

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

type CompetencyProgressRow = {
  competency: Competency;
  attempted: number;
  correct: number;
  percent: number;
  status: "Not enough data" | "Below threshold" | "At threshold" | "Mastered";
};

export default function LearnerProgressDashboard() {
  const [tracks, setTracks] = useState<ExamTrack[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<
    NormalizedSessionQuestion[]
  >([]);

  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedDisciplineId, setSelectedDisciplineId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");

    const [
      tracksResult,
      disciplinesResult,
      competenciesResult,
      sessionQuestionsResult
    ] = await Promise.all([
      supabase
        .from("exam_tracks")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true }),
      supabase
        .from("disciplines")
        .select("*")
        .order("name", { ascending: true }),
      supabase
        .from("competencies")
        .select("*")
        .order("name", { ascending: true }),
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

    if (sessionQuestionsResult.error) {
      setError(sessionQuestionsResult.error.message);
      setLoading(false);
      return;
    }

    const loadedTracks = (tracksResult.data ?? []) as ExamTrack[];
    const loadedDisciplines = (disciplinesResult.data ?? []) as Discipline[];
    const loadedCompetencies = (competenciesResult.data ?? []) as Competency[];
    const rawSessionQuestions = (sessionQuestionsResult.data ??
      []) as RawSessionQuestion[];

    const normalizedSessionQuestions: NormalizedSessionQuestion[] =
      rawSessionQuestions.map((row) => {
        const question = Array.isArray(row.questions)
          ? row.questions[0] ?? null
          : row.questions ?? null;

        return {
          id: row.id,
          is_correct: row.is_correct,
          question
        };
      });

    setTracks(loadedTracks);
    setDisciplines(loadedDisciplines);
    setCompetencies(loadedCompetencies);
    setSessionQuestions(normalizedSessionQuestions);

    if (!selectedTrackId && loadedTracks.length > 0) {
      setSelectedTrackId(loadedTracks[0].id);
    }

    if (
      selectedTrackId &&
      loadedTracks.length > 0 &&
      !loadedTracks.some((track) => track.id === selectedTrackId)
    ) {
      setSelectedTrackId(loadedTracks[0].id);
    }

    if (loadedTracks.length === 0) {
      setSelectedTrackId("");
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const visibleDisciplines = useMemo(() => {
    const visibleTrackIds = new Set(tracks.map((track) => track.id));

    return disciplines.filter(
      (discipline) =>
        discipline.exam_track_id !== null &&
        visibleTrackIds.has(discipline.exam_track_id)
    );
  }, [disciplines, tracks]);

  const filteredDisciplines = useMemo(() => {
    return visibleDisciplines.filter(
      (discipline) => discipline.exam_track_id === selectedTrackId
    );
  }, [visibleDisciplines, selectedTrackId]);

  useEffect(() => {
    if (filteredDisciplines.length === 0) {
      setSelectedDisciplineId("");
      return;
    }

    const exists = filteredDisciplines.some(
      (discipline) => discipline.id === selectedDisciplineId
    );

    if (!exists) {
      setSelectedDisciplineId(filteredDisciplines[0].id);
    }
  }, [filteredDisciplines, selectedDisciplineId]);

  const filteredCompetencies = useMemo(() => {
    return competencies.filter(
      (competency) => competency.discipline_id === selectedDisciplineId
    );
  }, [competencies, selectedDisciplineId]);

  const progressRows = useMemo<CompetencyProgressRow[]>(() => {
    return filteredCompetencies.map((competency) => {
      const relatedAnswers = sessionQuestions.filter(
        (row) =>
          row.question?.exam_track_id === selectedTrackId &&
          row.question?.discipline_id === selectedDisciplineId &&
          row.question?.competency_id === competency.id
      );

      const attempted = relatedAnswers.length;
      const correct = relatedAnswers.filter(
        (row) => row.is_correct === true
      ).length;
      const percent =
        attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

      let status: CompetencyProgressRow["status"] = "Not enough data";

      if (attempted < competency.minimum_questions) {
        status = "Not enough data";
      } else if (percent < competency.threshold_percent) {
        status = "Below threshold";
      } else if (percent < 80) {
        status = "At threshold";
      } else {
        status = "Mastered";
      }

      return {
        competency,
        attempted,
        correct,
        percent,
        status
      };
    });
  }, [filteredCompetencies, sessionQuestions, selectedTrackId, selectedDisciplineId]);

  const summary = useMemo(() => {
    const mastered = progressRows.filter(
      (row) => row.status === "Mastered"
    ).length;
    const atThreshold = progressRows.filter(
      (row) => row.status === "At threshold"
    ).length;
    const below = progressRows.filter(
      (row) => row.status === "Below threshold"
    ).length;
    const notEnough = progressRows.filter(
      (row) => row.status === "Not enough data"
    ).length;

    return {
      mastered,
      atThreshold,
      below,
      notEnough
    };
  }, [progressRows]);

  function getStatusStyle(
    status: CompetencyProgressRow["status"]
  ): CSSProperties {
    if (status === "Mastered") {
      return {
        backgroundColor: "#dcfce7",
        color: "#166534"
      };
    }

    if (status === "At threshold") {
      return {
        backgroundColor: "#dbeafe",
        color: "#1d4ed8"
      };
    }

    if (status === "Below threshold") {
      return {
        backgroundColor: "#fee2e2",
        color: "#b91c1c"
      };
    }

    return {
      backgroundColor: "#f1f5f9",
      color: "#475569"
    };
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          maxWidth: "920px"
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#0f2d69" }}>
          Competency Filters
        </h2>

        {loading ? (
          <p style={{ color: "#475569" }}>Loading progress data...</p>
        ) : (
          <>
            <label style={labelStyle}>Exam Track</label>
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              style={inputStyle}
            >
              {tracks.length === 0 ? (
                <option value="">No visible exam tracks available</option>
              ) : (
                tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))
              )}
            </select>

            <label style={labelStyle}>Discipline</label>
            <select
              value={selectedDisciplineId}
              onChange={(e) => setSelectedDisciplineId(e.target.value)}
              style={inputStyle}
            >
              {filteredDisciplines.length === 0 ? (
                <option value="">No disciplines available</option>
              ) : (
                filteredDisciplines.map((discipline) => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </option>
                ))
              )}
            </select>

            <button
              onClick={() => {
                void loadAll();
              }}
              style={primaryButtonStyle}
            >
              Refresh Progress
            </button>
          </>
        )}

        {error ? <p style={errorStyle}>{error}</p> : null}
      </section>

      {!loading ? (
        <>
          <section
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#0f2d69" }}>
              Competency Summary
            </h2>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap"
              }}
            >
              <span
                style={{
                  ...summaryPillStyle,
                  backgroundColor: "#dcfce7",
                  color: "#166534"
                }}
              >
                Mastered: {summary.mastered}
              </span>

              <span
                style={{
                  ...summaryPillStyle,
                  backgroundColor: "#dbeafe",
                  color: "#1d4ed8"
                }}
              >
                At Threshold: {summary.atThreshold}
              </span>

              <span
                style={{
                  ...summaryPillStyle,
                  backgroundColor: "#fee2e2",
                  color: "#b91c1c"
                }}
              >
                Below Threshold: {summary.below}
              </span>

              <span
                style={{
                  ...summaryPillStyle,
                  backgroundColor: "#f1f5f9",
                  color: "#475569"
                }}
              >
                Not Enough Data: {summary.notEnough}
              </span>
            </div>
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
              Competency Progress
            </h2>

            {progressRows.length === 0 ? (
              <p style={{ color: "#475569" }}>
                No competencies found for this discipline.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {progressRows.map((row) => (
                  <article
                    key={row.competency.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "16px"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        gap: "12px",
                        flexWrap: "wrap"
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: "0 0 8px 0",
                            color: "#0f172a",
                            fontSize: "20px"
                          }}
                        >
                          {row.competency.name}
                        </h3>

                        <p
                          style={{
                            margin: "0 0 12px 0",
                            color: "#475569",
                            lineHeight: 1.6
                          }}
                        >
                          {row.competency.description || "No description provided."}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap"
                          }}
                        >
                          <span style={summaryPillStyle}>
                            Attempted: {row.attempted}
                          </span>

                          <span style={summaryPillStyle}>
                            Correct: {row.correct}
                          </span>

                          <span style={summaryPillStyle}>
                            Accuracy: {row.percent}%
                          </span>

                          <span style={summaryPillStyle}>
                            Threshold: {row.competency.threshold_percent}%
                          </span>

                          <span style={summaryPillStyle}>
                            Minimum Questions: {row.competency.minimum_questions}
                          </span>
                        </div>
                      </div>

                      <span
                        style={{
                          ...getStatusStyle(row.status),
                          borderRadius: "999px",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {row.status}
                      </span>
                    </div>
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

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "8px"
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
  marginBottom: "16px",
  backgroundColor: "#fff",
  maxWidth: "520px"
};

const primaryButtonStyle: CSSProperties = {
  backgroundColor: "#0f2d69",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer"
};

const summaryPillStyle: CSSProperties = {
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: 700,
  backgroundColor: "#eff6ff",
  color: "#1d4ed8"
};

const errorStyle: CSSProperties = {
  marginTop: "16px",
  color: "#b91c1c",
  fontWeight: 700
};