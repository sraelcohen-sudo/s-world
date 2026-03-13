"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties
} from "react";
import { supabase } from "@/lib/supabase";
import type {
  Competency,
  Discipline,
  ExamTrack,
  Question
} from "@/types/database";

type AnswerOption = {
  id: string;
  question_id: string;
  option_label: string;
  option_text: string;
  is_correct: boolean;
};

type PracticeQuestion = Question & {
  options: AnswerOption[];
};

type SessionMode = "setup" | "in_progress" | "finished";

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

type SessionResult = {
  selectedOptionId: string;
  isCorrect: boolean;
};

type WeakCompetencyRow = {
  competency: Competency;
  attempted: number;
  correct: number;
  percent: number;
};

export default function LearnerRemediationDashboard() {
  const [tracks, setTracks] = useState<ExamTrack[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [approvedQuestions, setApprovedQuestions] = useState<Question[]>([]);
  const [allOptions, setAllOptions] = useState<AnswerOption[]>([]);
  const [sessionQuestionsHistory, setSessionQuestionsHistory] = useState<
    NormalizedSessionQuestion[]
  >([]);

  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedDisciplineId, setSelectedDisciplineId] = useState("");
  const [questionCount, setQuestionCount] = useState("10");

  const [mode, setMode] = useState<SessionMode>("setup");
  const [sessionId, setSessionId] = useState("");
  const [sessionQuestions, setSessionQuestions] = useState<PracticeQuestion[]>(
    []
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, SessionResult>>({});

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");

    const [
      tracksResult,
      disciplinesResult,
      competenciesResult,
      questionsResult,
      optionsResult,
      sessionQuestionsResult
    ] = await Promise.all([
      supabase
        .from("exam_tracks")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true }),
      supabase.from("disciplines").select("*").order("name", { ascending: true }),
      supabase
        .from("competencies")
        .select("*")
        .order("name", { ascending: true }),
      supabase
        .from("questions")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      supabase
        .from("answer_options")
        .select("*")
        .order("option_label", { ascending: true }),
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

    if (optionsResult.error) {
      setError(optionsResult.error.message);
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
    const loadedQuestions = (questionsResult.data ?? []) as Question[];
    const loadedOptions = (optionsResult.data ?? []) as AnswerOption[];

    const rawHistory = (sessionQuestionsResult.data ??
      []) as RawSessionQuestion[];

    const normalizedHistory: NormalizedSessionQuestion[] = rawHistory.map(
      (row) => {
        const question = Array.isArray(row.questions)
          ? row.questions[0] ?? null
          : row.questions ?? null;

        return {
          id: row.id,
          is_correct: row.is_correct,
          question
        };
      }
    );

    setTracks(loadedTracks);
    setDisciplines(loadedDisciplines);
    setCompetencies(loadedCompetencies);
    setApprovedQuestions(loadedQuestions);
    setAllOptions(loadedOptions);
    setSessionQuestionsHistory(normalizedHistory);

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

  const weakCompetencies = useMemo<WeakCompetencyRow[]>(() => {
    return filteredCompetencies
      .map((competency) => {
        const relatedAnswers = sessionQuestionsHistory.filter(
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

        return {
          competency,
          attempted,
          correct,
          percent
        };
      })
      .filter(
        (row) =>
          row.attempted >= row.competency.minimum_questions &&
          row.percent < row.competency.threshold_percent
      )
      .sort((a, b) => a.percent - b.percent);
  }, [
    filteredCompetencies,
    sessionQuestionsHistory,
    selectedTrackId,
    selectedDisciplineId
  ]);

  const remediationQuestionPool = useMemo(() => {
    const weakCompetencyIds = new Set(
      weakCompetencies.map((row) => row.competency.id)
    );

    return approvedQuestions.filter(
      (question) =>
        question.exam_track_id === selectedTrackId &&
        question.discipline_id === selectedDisciplineId &&
        question.competency_id !== null &&
        weakCompetencyIds.has(question.competency_id)
    );
  }, [
    approvedQuestions,
    weakCompetencies,
    selectedTrackId,
    selectedDisciplineId
  ]);

  const currentQuestion = sessionQuestions[currentIndex] ?? null;
  const correctOptionId =
    currentQuestion?.options.find((option) => option.is_correct)?.id ?? "";

  const score = useMemo(() => {
    return Object.values(results).filter((result) => result.isCorrect).length;
  }, [results]);

  async function startRemediationSession() {
    setStarting(true);
    setError("");
    setMessage("");

    const parsedCount = Number(questionCount);

    if (!selectedTrackId || !selectedDisciplineId) {
      setError("Please choose an exam track and discipline.");
      setStarting(false);
      return;
    }

    if (Number.isNaN(parsedCount) || parsedCount < 1 || parsedCount > 200) {
      setError("Question count must be between 1 and 200.");
      setStarting(false);
      return;
    }

    if (weakCompetencies.length === 0) {
      setError("No below-threshold competencies were found for this discipline.");
      setStarting(false);
      return;
    }

    if (remediationQuestionPool.length === 0) {
      setError(
        "No approved questions are available for the below-threshold competencies."
      );
      setStarting(false);
      return;
    }

    const chosenQuestions = remediationQuestionPool
      .slice(0, parsedCount)
      .map((question) => ({
        ...question,
        options: allOptions
          .filter((option) => option.question_id === question.id)
          .sort((a, b) => a.option_label.localeCompare(b.option_label))
      }))
      .filter((question) => question.options.length >= 2);

    if (chosenQuestions.length === 0) {
      setError(
        "Remediation questions were found, but no answer options are attached."
      );
      setStarting(false);
      return;
    }

    const guestUserId = crypto.randomUUID();

    const { data: insertedSession, error: sessionError } = await supabase
      .from("study_sessions")
      .insert({
        user_id: guestUserId,
        exam_track_id: selectedTrackId,
        discipline_id: selectedDisciplineId,
        mode: "weak_areas",
        max_questions: chosenQuestions.length
      })
      .select()
      .single();

    if (sessionError || !insertedSession) {
      setError(sessionError?.message || "Failed to create remediation session.");
      setStarting(false);
      return;
    }

    const sessionQuestionRows = chosenQuestions.map((question, index) => ({
      session_id: insertedSession.id,
      question_id: question.id,
      sequence_number: index + 1
    }));

    const { error: sessionQuestionsError } = await supabase
      .from("session_questions")
      .insert(sessionQuestionRows);

    if (sessionQuestionsError) {
      setError(sessionQuestionsError.message);
      setStarting(false);
      return;
    }

    setSessionId(insertedSession.id);
    setSessionQuestions(chosenQuestions);
    setCurrentIndex(0);
    setSelectedOptionId("");
    setSubmitted(false);
    setResults({});
    setMode("in_progress");
    setStarting(false);
  }

  async function submitAnswer() {
    if (!currentQuestion || !selectedOptionId) {
      setError("Please select an answer choice.");
      return;
    }

    setError("");

    const isCorrect = selectedOptionId === correctOptionId;

    setResults((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        selectedOptionId,
        isCorrect
      }
    }));

    setSubmitted(true);

    const { error: updateError } = await supabase
      .from("session_questions")
      .update({
        selected_option_id: selectedOptionId,
        is_correct: isCorrect,
        answered_at: new Date().toISOString()
      })
      .eq("session_id", sessionId)
      .eq("question_id", currentQuestion.id);

    if (updateError) {
      setError(updateError.message);
    }
  }

  async function goToNext() {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId("");
      setSubmitted(false);
      setError("");
      return;
    }

    const { error: finishError } = await supabase
      .from("study_sessions")
      .update({
        ended_at: new Date().toISOString()
      })
      .eq("id", sessionId);

    if (finishError) {
      setError(finishError.message);
    }

    setMode("finished");
  }

  function restartSetup() {
    setMode("setup");
    setSessionId("");
    setSessionQuestions([]);
    setCurrentIndex(0);
    setSelectedOptionId("");
    setSubmitted(false);
    setResults({});
    setMessage("");
    setError("");
    void loadAll();
  }

  const currentResult = currentQuestion ? results[currentQuestion.id] : undefined;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {mode === "setup" ? (
        <>
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
              Start Remediation Block
            </h2>

            {loading ? (
              <p style={{ color: "#475569" }}>Loading remediation setup...</p>
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

                <label style={labelStyle}>Number of Questions</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  step="1"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  style={inputStyle}
                />

                <div style={infoBoxStyle}>
                  Below-threshold competencies: {weakCompetencies.length}
                </div>

                <div style={infoBoxStyle}>
                  Remediation question pool: {remediationQuestionPool.length}
                </div>

                <button
                  onClick={() => {
                    void startRemediationSession();
                  }}
                  disabled={
                    starting ||
                    weakCompetencies.length === 0 ||
                    remediationQuestionPool.length === 0
                  }
                  style={{
                    backgroundColor:
                      starting ||
                      weakCompetencies.length === 0 ||
                      remediationQuestionPool.length === 0
                        ? "#94a3b8"
                        : "#0f2d69",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px 18px",
                    fontWeight: 700,
                    cursor:
                      starting ||
                      weakCompetencies.length === 0 ||
                      remediationQuestionPool.length === 0
                        ? "not-allowed"
                        : "pointer"
                  }}
                >
                  {starting ? "Starting..." : "Start Remediation Block"}
                </button>
              </>
            )}

            {message ? <p style={successStyle}>{message}</p> : null}
            {error ? <p style={errorStyle}>{error}</p> : null}
          </section>

          {!loading ? (
            <section
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#0f2d69" }}>
                Below-Threshold Competencies
              </h2>

              {weakCompetencies.length === 0 ? (
                <p style={{ color: "#475569" }}>
                  No competencies are currently below threshold for this discipline.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "14px" }}>
                  {weakCompetencies.map((row) => (
                    <article
                      key={row.competency.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "16px"
                      }}
                    >
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

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <span style={summaryPillStyle}>
                          Attempted: {row.attempted}
                        </span>
                        <span style={summaryPillStyle}>Correct: {row.correct}</span>
                        <span style={summaryPillStyle}>Accuracy: {row.percent}%</span>
                        <span style={summaryPillStyle}>
                          Threshold: {row.competency.threshold_percent}%
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </>
      ) : null}

      {mode === "in_progress" && currentQuestion ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.9fr",
            gap: "24px",
            alignItems: "start"
          }}
        >
          <section
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
            }}
          >
            <div
              style={{
                backgroundColor: "#7c2d12",
                color: "#ffffff",
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                fontWeight: 700
              }}
            >
              <span>
                Remediation Question {currentIndex + 1} of {sessionQuestions.length}
              </span>
              <span>Weak Areas Mode</span>
            </div>

            <div style={{ padding: "24px" }}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>
                {currentQuestion.title || "Untitled question"}
              </h2>

              <p style={questionTextStyle}>{currentQuestion.stem}</p>

              {currentQuestion.lead_in ? (
                <p
                  style={{
                    ...questionTextStyle,
                    fontWeight: 700,
                    color: "#0f172a"
                  }}
                >
                  {currentQuestion.lead_in}
                </p>
              ) : null}

              <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  const showCorrect = submitted && option.is_correct;
                  const showWrong = submitted && isSelected && !option.is_correct;

                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (!submitted) setSelectedOptionId(option.id);
                      }}
                      disabled={submitted}
                      style={{
                        textAlign: "left",
                        border: showCorrect
                          ? "2px solid #16a34a"
                          : showWrong
                            ? "2px solid #dc2626"
                            : isSelected
                              ? "2px solid #7c2d12"
                              : "1px solid #cbd5e1",
                        backgroundColor: showCorrect
                          ? "#f0fdf4"
                          : showWrong
                            ? "#fef2f2"
                            : isSelected
                              ? "#fff7ed"
                              : "#ffffff",
                        borderRadius: "12px",
                        padding: "14px",
                        cursor: submitted ? "default" : "pointer"
                      }}
                    >
                      <strong style={{ color: "#7c2d12" }}>
                        {option.option_label}.
                      </strong>{" "}
                      <span style={{ color: "#334155" }}>{option.option_text}</span>
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap"
                }}
              >
                {!submitted ? (
                  <button
                    onClick={() => {
                      void submitAnswer();
                    }}
                    style={remediationButtonStyle}
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      void goToNext();
                    }}
                    style={remediationButtonStyle}
                  >
                    {currentIndex === sessionQuestions.length - 1
                      ? "Finish Block"
                      : "Next Question"}
                  </button>
                )}
              </div>

              {error ? <p style={errorStyle}>{error}</p> : null}
            </div>
          </section>

          <section
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
            }}
          >
            <div
              style={{
                backgroundColor: "#ffedd5",
                color: "#7c2d12",
                padding: "14px 18px",
                fontWeight: 700
              }}
            >
              Remediation Guidance
            </div>

            <div style={{ padding: "24px" }}>
              {!submitted ? (
                <p style={{ color: "#475569", lineHeight: 1.6 }}>
                  Submit your answer to view the explanation and reinforce the weak concept.
                </p>
              ) : (
                <>
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "12px",
                      borderRadius: "10px",
                      backgroundColor: currentResult?.isCorrect
                        ? "#dcfce7"
                        : "#fee2e2",
                      color: currentResult?.isCorrect ? "#166534" : "#b91c1c",
                      fontWeight: 700
                    }}
                  >
                    {currentResult?.isCorrect ? "Correct" : "Incorrect"}
                  </div>

                  <h3 style={sideHeadingStyle}>Explanation</h3>
                  <p style={sideBodyStyle}>
                    {currentQuestion.explanation || "No explanation provided."}
                  </p>

                  {currentQuestion.strategy_text ? (
                    <>
                      <h3 style={sideHeadingStyle}>Strategy</h3>
                      <p style={sideBodyStyle}>{currentQuestion.strategy_text}</p>
                    </>
                  ) : null}

                  {currentQuestion.resources_text ? (
                    <>
                      <h3 style={sideHeadingStyle}>Resources</h3>
                      <p style={sideBodyStyle}>{currentQuestion.resources_text}</p>
                    </>
                  ) : null}

                  {currentQuestion.info_text ? (
                    <>
                      <h3 style={sideHeadingStyle}>Info</h3>
                      <p style={sideBodyStyle}>{currentQuestion.info_text}</p>
                    </>
                  ) : null}
                </>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {mode === "finished" ? (
        <section
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "840px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
          }}
        >
          <h2 style={{ marginTop: 0, color: "#7c2d12" }}>
            Remediation Block Complete
          </h2>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "20px"
            }}
          >
            <span style={summaryPillStyle}>
              Score: {score} / {sessionQuestions.length}
            </span>
            <span style={summaryPillStyle}>
              Accuracy:{" "}
              {sessionQuestions.length > 0
                ? Math.round((score / sessionQuestions.length) * 100)
                : 0}
              %
            </span>
          </div>

          <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
            {sessionQuestions.map((question, index) => {
              const result = results[question.id];

              return (
                <article
                  key={question.id}
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
                    Question {index + 1}
                  </p>

                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      color: "#0f172a",
                      fontSize: "18px"
                    }}
                  >
                    {question.title || "Untitled question"}
                  </h3>

                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
                    {result?.isCorrect ? "Correct" : "Incorrect"}
                  </p>
                </article>
              );
            })}
          </div>

          <button onClick={restartSetup} style={remediationButtonStyle}>
            Start New Remediation Block
          </button>
        </section>
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

const remediationButtonStyle: CSSProperties = {
  backgroundColor: "#7c2d12",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer"
};

const questionTextStyle: CSSProperties = {
  color: "#334155",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap"
};

const sideHeadingStyle: CSSProperties = {
  margin: "18px 0 8px 0",
  color: "#0f172a",
  fontSize: "18px"
};

const sideBodyStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap"
};

const summaryPillStyle: CSSProperties = {
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: 700,
  backgroundColor: "#ffedd5",
  color: "#9a3412"
};

const infoBoxStyle: CSSProperties = {
  marginBottom: "16px",
  padding: "12px",
  borderRadius: "10px",
  backgroundColor: "#f8fafc",
  color: "#334155",
  fontWeight: 700
};

const successStyle: CSSProperties = {
  marginTop: "16px",
  color: "#166534",
  fontWeight: 700
};

const errorStyle: CSSProperties = {
  marginTop: "16px",
  color: "#b91c1c",
  fontWeight: 700
};