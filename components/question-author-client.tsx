"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  Competency,
  Discipline,
  ExamTrack,
  Question,
  Subtopic
} from "@/types/database";

type OptionState = {
  label: string;
  text: string;
};

const createDefaultOptions = (): OptionState[] => [
  { label: "A", text: "" },
  { label: "B", text: "" },
  { label: "C", text: "" },
  { label: "D", text: "" },
  { label: "E", text: "" }
];

export default function QuestionAuthorClient() {
  const [tracks, setTracks] = useState<ExamTrack[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");

  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedDisciplineId, setSelectedDisciplineId] = useState("");
  const [selectedCompetencyId, setSelectedCompetencyId] = useState("");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState("");

  const [title, setTitle] = useState("");
  const [stem, setStem] = useState("");
  const [leadIn, setLeadIn] = useState("");
  const [explanation, setExplanation] = useState("");
  const [strategyText, setStrategyText] = useState("");
  const [resourcesText, setResourcesText] = useState("");
  const [infoText, setInfoText] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [cognitiveLevel, setCognitiveLevel] = useState<
    "recall" | "application" | "clinical_reasoning"
  >("application");
  const [sourceType, setSourceType] = useState<"original" | "adapted" | "imported">(
    "original"
  );
  const [authorReference, setAuthorReference] = useState("");
  const [estimatedTimeSeconds, setEstimatedTimeSeconds] = useState("90");
  const [correctOption, setCorrectOption] = useState("A");
  const [options, setOptions] = useState<OptionState[]>(createDefaultOptions());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");

    const [
      tracksResult,
      disciplinesResult,
      competenciesResult,
      subtopicsResult,
      questionsResult
    ] = await Promise.all([
      supabase.from("exam_tracks").select("*").eq("active", true).order("name", { ascending: true }),
      supabase.from("disciplines").select("*").order("name", { ascending: true }),
      supabase.from("competencies").select("*").order("name", { ascending: true }),
      supabase.from("subtopics").select("*").order("name", { ascending: true }),
      supabase.from("questions").select("*").order("created_at", { ascending: false }).limit(20)
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

    if (subtopicsResult.error) {
      setError(subtopicsResult.error.message);
      setLoading(false);
      return;
    }

    if (questionsResult.error) {
      setError(questionsResult.error.message);
      setLoading(false);
      return;
    }

    const loadedTracks = (tracksResult.data ?? []) as ExamTrack[];
    const loadedDisciplines = (disciplinesResult.data ?? []) as Discipline[];
    const loadedCompetencies = (competenciesResult.data ?? []) as Competency[];
    const loadedSubtopics = (subtopicsResult.data ?? []) as Subtopic[];
    const loadedQuestions = (questionsResult.data ?? []) as Question[];

    setTracks(loadedTracks);
    setDisciplines(loadedDisciplines);
    setCompetencies(loadedCompetencies);
    setSubtopics(loadedSubtopics);
    setQuestions(loadedQuestions);

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
    loadAll();
  }, []);

  const visibleDisciplines = useMemo(() => {
    const visibleTrackIds = new Set(tracks.map((track) => track.id));
    return disciplines.filter(
      (discipline) =>
        discipline.exam_track_id !== null && visibleTrackIds.has(discipline.exam_track_id)
    );
  }, [disciplines, tracks]);

  const filteredDisciplines = useMemo(() => {
    return visibleDisciplines.filter((d) => d.exam_track_id === selectedTrackId);
  }, [visibleDisciplines, selectedTrackId]);

  useEffect(() => {
    if (filteredDisciplines.length === 0) {
      setSelectedDisciplineId("");
      return;
    }

    const exists = filteredDisciplines.some((d) => d.id === selectedDisciplineId);
    if (!exists) {
      setSelectedDisciplineId(filteredDisciplines[0].id);
    }
  }, [filteredDisciplines, selectedDisciplineId]);

  const visibleDisciplineIds = useMemo(() => {
    return new Set(visibleDisciplines.map((discipline) => discipline.id));
  }, [visibleDisciplines]);

  const visibleCompetencies = useMemo(() => {
    return competencies.filter((c) => visibleDisciplineIds.has(c.discipline_id));
  }, [competencies, visibleDisciplineIds]);

  const filteredCompetencies = useMemo(() => {
    return visibleCompetencies.filter((c) => c.discipline_id === selectedDisciplineId);
  }, [visibleCompetencies, selectedDisciplineId]);

  useEffect(() => {
    if (filteredCompetencies.length === 0) {
      setSelectedCompetencyId("");
      return;
    }

    const exists = filteredCompetencies.some((c) => c.id === selectedCompetencyId);
    if (!exists) {
      setSelectedCompetencyId(filteredCompetencies[0].id);
    }
  }, [filteredCompetencies, selectedCompetencyId]);

  const filteredSubtopics = useMemo(() => {
    return subtopics.filter((s) => s.competency_id === selectedCompetencyId);
  }, [subtopics, selectedCompetencyId]);

  useEffect(() => {
    if (filteredSubtopics.length === 0) {
      setSelectedSubtopicId("");
      return;
    }

    const exists = filteredSubtopics.some((s) => s.id === selectedSubtopicId);
    if (!exists) {
      setSelectedSubtopicId(filteredSubtopics[0].id);
    }
  }, [filteredSubtopics, selectedSubtopicId]);

  function updateOptionText(index: number, value: string) {
    setOptions((prev) =>
      prev.map((option, i) => (i === index ? { ...option, text: value } : option))
    );
  }

  function resetForm() {
    setTitle("");
    setStem("");
    setLeadIn("");
    setExplanation("");
    setStrategyText("");
    setResourcesText("");
    setInfoText("");
    setDifficulty("medium");
    setCognitiveLevel("application");
    setSourceType("original");
    setAuthorReference("");
    setEstimatedTimeSeconds("90");
    setCorrectOption("A");
    setOptions(createDefaultOptions());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const cleanAuthorName = authorName.trim();
    const cleanAuthorEmail = authorEmail.trim().toLowerCase();
    const cleanStem = stem.trim();
    const cleanExplanation = explanation.trim();
    const cleanLeadIn = leadIn.trim();
    const cleanTitle = title.trim();
    const parsedTime = Number(estimatedTimeSeconds);

    if (!cleanAuthorName) {
      setError("Contributor name is required.");
      setSaving(false);
      return;
    }

    if (!cleanAuthorEmail || !cleanAuthorEmail.includes("@")) {
      setError("A valid contributor email is required.");
      setSaving(false);
      return;
    }

    if (!selectedTrackId || !selectedDisciplineId || !selectedCompetencyId) {
      setError("Please select an exam track, discipline, and competency.");
      setSaving(false);
      return;
    }

    if (!cleanStem) {
      setError("Question stem is required.");
      setSaving(false);
      return;
    }

    if (!cleanExplanation) {
      setError("Explanation is required.");
      setSaving(false);
      return;
    }

    const filledOptions = options.filter((option) => option.text.trim() !== "");
    if (filledOptions.length < 4) {
      setError("Please provide at least four answer options.");
      setSaving(false);
      return;
    }

    const correctExists = filledOptions.some((option) => option.label === correctOption);
    if (!correctExists) {
      setError("The selected correct answer must have text.");
      setSaving(false);
      return;
    }

    if (Number.isNaN(parsedTime) || parsedTime < 10) {
      setError("Estimated time must be at least 10 seconds.");
      setSaving(false);
      return;
    }

    const authorId = crypto.randomUUID();

    const { data: insertedQuestion, error: questionError } = await supabase
      .from("questions")
      .insert({
        title: cleanTitle || null,
        stem: cleanStem,
        lead_in: cleanLeadIn || null,
        explanation: cleanExplanation,
        strategy_text: strategyText.trim() || null,
        resources_text: resourcesText.trim() || null,
        info_text: infoText.trim() || null,
        difficulty,
        cognitive_level: cognitiveLevel,
        source_type: sourceType,
        author_reference: authorReference.trim() || null,
        estimated_time_seconds: parsedTime,
        exam_track_id: selectedTrackId,
        discipline_id: selectedDisciplineId,
        competency_id: selectedCompetencyId,
        subtopic_id: selectedSubtopicId || null,
        author_id: authorId,
        status: "submitted"
      })
      .select()
      .single();

    if (questionError || !insertedQuestion) {
      setError(questionError?.message || "Failed to create question.");
      setSaving(false);
      return;
    }

    const optionRows = filledOptions.map((option) => ({
      question_id: insertedQuestion.id,
      option_label: option.label,
      option_text: option.text.trim(),
      is_correct: option.label === correctOption
    }));

    const { error: optionsError } = await supabase.from("answer_options").insert(optionRows);

    if (optionsError) {
      setError(optionsError.message);
      setSaving(false);
      return;
    }

    const { error: submissionError } = await supabase.from("question_submissions").insert({
      question_id: insertedQuestion.id,
      submitted_by: authorId,
      status: "submitted",
      author_name: cleanAuthorName,
      author_email: cleanAuthorEmail
    });

    if (submissionError) {
      setError(submissionError.message);
      setSaving(false);
      return;
    }

    setMessage("Question submitted successfully.");
    resetForm();
    await loadAll();
    setSaving(false);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(380px, 520px) 1fr",
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
        <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#0f2d69" }}>
          Create Question
        </h2>

        <form onSubmit={handleSubmit}>
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

          <label style={labelStyle}>Competency</label>
          <select
            value={selectedCompetencyId}
            onChange={(e) => setSelectedCompetencyId(e.target.value)}
            style={inputStyle}
          >
            {filteredCompetencies.length === 0 ? (
              <option value="">No competencies available</option>
            ) : (
              filteredCompetencies.map((competency) => (
                <option key={competency.id} value={competency.id}>
                  {competency.name}
                </option>
              ))
            )}
          </select>

          <label style={labelStyle}>Subtopic</label>
          <select
            value={selectedSubtopicId}
            onChange={(e) => setSelectedSubtopicId(e.target.value)}
            style={inputStyle}
          >
            {filteredSubtopics.length === 0 ? (
              <option value="">No subtopic selected</option>
            ) : (
              filteredSubtopics.map((subtopic) => (
                <option key={subtopic.id} value={subtopic.id}>
                  {subtopic.name}
                </option>
              ))
            )}
          </select>

          <label style={labelStyle}>Question Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Neonatal jaundice diagnosis"
            style={inputStyle}
          />

          <label style={labelStyle}>Question Stem</label>
          <textarea
            value={stem}
            onChange={(e) => setStem(e.target.value)}
            rows={6}
            placeholder="A 3-day-old infant presents with..."
            style={textareaStyle}
          />

          <label style={labelStyle}>Lead-in</label>
          <input
            value={leadIn}
            onChange={(e) => setLeadIn(e.target.value)}
            placeholder="Which of the following is the most likely diagnosis?"
            style={inputStyle}
          />

          <label style={labelStyle}>Answer Options</label>
          <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
            {options.map((option, index) => (
              <div
                key={option.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr",
                  gap: "10px",
                  alignItems: "center"
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "#0f2d69",
                    textAlign: "center"
                  }}
                >
                  {option.label}
                </div>
                <input
                  value={option.text}
                  onChange={(e) => updateOptionText(index, e.target.value)}
                  placeholder={`Option ${option.label}`}
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
              </div>
            ))}
          </div>

          <label style={labelStyle}>Correct Answer</label>
          <select
            value={correctOption}
            onChange={(e) => setCorrectOption(e.target.value)}
            style={inputStyle}
          >
            {options.map((option) => (
              <option key={option.label} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Explanation</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={6}
            placeholder="Explain why the correct answer is right and the others are wrong."
            style={textareaStyle}
          />

          <label style={labelStyle}>Strategy Text</label>
          <textarea
            value={strategyText}
            onChange={(e) => setStrategyText(e.target.value)}
            rows={3}
            placeholder="Test-taking strategy or clue recognition tips"
            style={textareaStyle}
          />

          <label style={labelStyle}>Resources Text</label>
          <textarea
            value={resourcesText}
            onChange={(e) => setResourcesText(e.target.value)}
            rows={3}
            placeholder="Suggested follow-up reading or resources"
            style={textareaStyle}
          />

          <label style={labelStyle}>Info Text</label>
          <textarea
            value={infoText}
            onChange={(e) => setInfoText(e.target.value)}
            rows={3}
            placeholder="Additional notes for tutor mode"
            style={textareaStyle}
          />

          <label style={labelStyle}>Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
            style={inputStyle}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <label style={labelStyle}>Cognitive Level</label>
          <select
            value={cognitiveLevel}
            onChange={(e) =>
              setCognitiveLevel(
                e.target.value as "recall" | "application" | "clinical_reasoning"
              )
            }
            style={inputStyle}
          >
            <option value="recall">Recall</option>
            <option value="application">Application</option>
            <option value="clinical_reasoning">Clinical Reasoning</option>
          </select>

          <label style={labelStyle}>Source Type</label>
          <select
            value={sourceType}
            onChange={(e) =>
              setSourceType(e.target.value as "original" | "adapted" | "imported")
            }
            style={inputStyle}
          >
            <option value="original">Original</option>
            <option value="adapted">Adapted</option>
            <option value="imported">Imported</option>
          </select>

          <label style={labelStyle}>Author Reference</label>
          <input
            value={authorReference}
            onChange={(e) => setAuthorReference(e.target.value)}
            placeholder="Nelson Textbook of Pediatrics, chapter 12"
            style={inputStyle}
          />

          <label style={labelStyle}>Estimated Time (seconds)</label>
          <input
            type="number"
            min="10"
            step="1"
            value={estimatedTimeSeconds}
            onChange={(e) => setEstimatedTimeSeconds(e.target.value)}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={saving || tracks.length === 0}
            style={{
              backgroundColor: saving || tracks.length === 0 ? "#94a3b8" : "#0f2d69",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 18px",
              fontWeight: 700,
              cursor: saving || tracks.length === 0 ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Submitting..." : "Submit Question"}
          </button>
        </form>

        {message ? <p style={successStyle}>{message}</p> : null}
        {error ? <p style={errorStyle}>{error}</p> : null}
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
          Recent Questions
        </h2>

        {loading ? (
          <p style={{ color: "#475569" }}>Loading questions...</p>
        ) : questions.length === 0 ? (
          <p style={{ color: "#475569" }}>No questions submitted yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {questions.map((question) => (
              <article
                key={question.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px"
                }}
              >
                <h3 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "18px" }}>
                  {question.title || "Untitled question"}
                </h3>
                <p style={{ margin: "0 0 10px 0", color: "#475569", lineHeight: 1.5 }}>
                  {question.lead_in || question.stem.slice(0, 160)}
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span style={pillStyle}>{question.status}</span>
                  <span style={pillStyle}>{question.difficulty}</span>
                  <span style={pillStyle}>{question.cognitive_level}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
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

const pillStyle: React.CSSProperties = {
  backgroundColor: "#eff6ff",
  color: "#1d4ed8",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 700
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