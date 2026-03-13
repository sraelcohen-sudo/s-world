"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type {
  Subject,
  Topic,
  Subtopic,
  Question
} from "@/types/catalog.types";

type QuestionSummary = Pick<
  Question,
  "id" | "stem" | "correct_answer" | "created_at"
> & {
  subject_name: string;
  topic_name: string;
  subtopic_name: string;
};

type OptionKey = "A" | "B" | "C" | "D" | "E";

type AuthorFormState = {
  subjectId: string;
  topicId: string;
  subtopicId: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: OptionKey;
  explanation: string;
  source: string;
};

type SubjectsApiResponse = {
  success: boolean;
  subjects: Subject[];
};

type TopicsApiResponse = {
  success: boolean;
  topics: Topic[];
};

type SubtopicsApiResponse = {
  success: boolean;
  subtopics: Subtopic[];
};

type CreateQuestionApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

const initialForm: AuthorFormState = {
  subjectId: "",
  topicId: "",
  subtopicId: "",
  stem: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  optionE: "",
  correctAnswer: "A",
  explanation: "",
  source: ""
};

export default function AuthorQuestionWorkbench() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<QuestionSummary[]>([]);
  const [form, setForm] = useState<AuthorFormState>(initialForm);

  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingRecentQuestions, setLoadingRecentQuestions] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void initializeWorkbench();
  }, []);

  useEffect(() => {
    if (!form.subjectId) {
      setTopics([]);
      setSubtopics([]);
      setForm((prev) => ({
        ...prev,
        topicId: "",
        subtopicId: ""
      }));
      return;
    }

    void loadTopics(form.subjectId);
  }, [form.subjectId]);

  useEffect(() => {
    if (!form.topicId) {
      setSubtopics([]);
      setForm((prev) => ({
        ...prev,
        subtopicId: ""
      }));
      return;
    }

    void loadSubtopics(form.topicId);
  }, [form.topicId]);

  async function initializeWorkbench() {
    await Promise.all([loadSubjects(), loadRecentQuestions()]);
  }

  async function loadSubjects() {
    try {
      setLoadingCatalog(true);
      setError("");

      const response = await fetch("/api/subjects", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load subjects.");
      }

      const data = (await response.json()) as SubjectsApiResponse;

      if (!data.success) {
        throw new Error("Failed to load subjects.");
      }

      const loadedSubjects = data.subjects ?? [];
      setSubjects(loadedSubjects);

      if (loadedSubjects.length > 0) {
        setForm((prev) => ({
          ...prev,
          subjectId:
  loadedSubjects.find((subject) => subject.id === prev.subjectId)?.id ??
  prev.subjectId ??
  loadedSubjects[0].id
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subjects.");
      setSubjects([]);
    } finally {
      setLoadingCatalog(false);
    }
  }

  async function loadTopics(subjectId: string) {
    try {
      setError("");

      const response = await fetch(`/api/topics/${subjectId}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Failed to load topics.");
      }

      const data = (await response.json()) as TopicsApiResponse;

      if (!data.success) {
        throw new Error("Failed to load topics.");
      }

      const loadedTopics = data.topics ?? [];
      setTopics(loadedTopics);

      setForm((prev) => {
        const nextTopicId =
          loadedTopics.find((topic) => topic.id === prev.topicId)?.id ??
          loadedTopics[0]?.id ??
          "";

        return {
          ...prev,
          topicId: nextTopicId,
          subtopicId: ""
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load topics.");
      setTopics([]);
      setSubtopics([]);
      setForm((prev) => ({
        ...prev,
        topicId: "",
        subtopicId: ""
      }));
    }
  }

  async function loadSubtopics(topicId: string) {
    try {
      setError("");

      const response = await fetch(`/api/subtopics/${topicId}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Failed to load subtopics.");
      }

      const data = (await response.json()) as SubtopicsApiResponse;

      if (!data.success) {
        throw new Error("Failed to load subtopics.");
      }

      const loadedSubtopics = data.subtopics ?? [];
      setSubtopics(loadedSubtopics);

      setForm((prev) => ({
        ...prev,
        subtopicId:
          loadedSubtopics.find((subtopic) => subtopic.id === prev.subtopicId)?.id ??
          loadedSubtopics[0]?.id ??
          ""
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subtopics.");
      setSubtopics([]);
      setForm((prev) => ({
        ...prev,
        subtopicId: ""
      }));
    }
  }

  async function loadRecentQuestions() {
    try {
      setLoadingRecentQuestions(true);

      const response = await fetch("/api/questions/recent", {
        cache: "no-store"
      });

      if (!response.ok) {
        setRecentQuestions([]);
        return;
      }

      const data = (await response.json()) as QuestionSummary[];
      setRecentQuestions(data);
    } catch {
      setRecentQuestions([]);
    } finally {
      setLoadingRecentQuestions(false);
    }
  }

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === form.subjectId) ?? null,
    [subjects, form.subjectId]
  );

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === form.topicId) ?? null,
    [topics, form.topicId]
  );

  const selectedSubtopic = useMemo(
    () => subtopics.find((subtopic) => subtopic.id === form.subtopicId) ?? null,
    [subtopics, form.subtopicId]
  );

  function updateField<K extends keyof AuthorFormState>(
    key: K,
    value: AuthorFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm((prev) => ({
      ...initialForm,
      subjectId: prev.subjectId,
      topicId: prev.topicId,
      subtopicId: prev.subtopicId
    }));
    setMessage("");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      subtopic_id: form.subtopicId,
      stem: form.stem.trim(),
      option_a: form.optionA.trim(),
      option_b: form.optionB.trim(),
      option_c: form.optionC.trim(),
      option_d: form.optionD.trim(),
      option_e: form.optionE.trim(),
      correct_answer: form.correctAnswer,
      explanation: form.explanation.trim(),
      source: form.source.trim() || null
    };

    if (!payload.subtopic_id) {
      setError("Please select a subtopic.");
      setSaving(false);
      return;
    }

    if (!payload.stem) {
      setError("Question stem is required.");
      setSaving(false);
      return;
    }

    if (!payload.explanation) {
      setError("Explanation is required.");
      setSaving(false);
      return;
    }

    const options = [
      payload.option_a,
      payload.option_b,
      payload.option_c,
      payload.option_d,
      payload.option_e
    ];

    if (options.some((option) => option.length === 0)) {
      setError("All five answer options are required.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/questions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as CreateQuestionApiResponse;

      if (!response.ok) {
        throw new Error(result.error || "Failed to create question.");
      }

      setMessage(result.message || "Question created successfully.");
      resetForm();
      await loadRecentQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create question.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section style={cardStyle}>
        <h1 style={pageTitleStyle}>Question Authoring Workbench</h1>
        <p style={pageSubtitleStyle}>
          Create Step 1 questions using the live subject, topic, and subtopic
          catalog.
        </p>

        {loadingCatalog ? <p style={mutedTextStyle}>Loading catalog...</p> : null}
        {error ? <p style={errorTextStyle}>{error}</p> : null}
        {message ? <p style={successTextStyle}>{message}</p> : null}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <div style={threeColumnGridStyle}>
            <label style={fieldLabelStyle}>
              <span>Subject</span>
              <select
                value={form.subjectId}
                onChange={(e) => updateField("subjectId", e.target.value)}
                style={inputStyle}
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={fieldLabelStyle}>
              <span>Topic</span>
              <select
                value={form.topicId}
                onChange={(e) => updateField("topicId", e.target.value)}
                disabled={!form.subjectId}
                style={inputStyle}
              >
                <option value="">Select topic</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={fieldLabelStyle}>
              <span>Subtopic</span>
              <select
                value={form.subtopicId}
                onChange={(e) => updateField("subtopicId", e.target.value)}
                disabled={!form.topicId}
                style={inputStyle}
              >
                <option value="">Select subtopic</option>
                {subtopics.map((subtopic) => (
                  <option key={subtopic.id} value={subtopic.id}>
                    {subtopic.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={pathCardStyle}>
            <strong>Selected Path</strong>
            <div style={{ marginTop: 8, color: "#334155" }}>
              {selectedSubject?.name || "No subject"} →{" "}
              {selectedTopic?.name || "No topic"} →{" "}
              {selectedSubtopic?.name || "No subtopic"}
            </div>
          </div>

          <label style={fieldLabelStyle}>
            <span>Question Stem</span>
            <textarea
              rows={6}
              value={form.stem}
              onChange={(e) => updateField("stem", e.target.value)}
              placeholder="Enter the question stem..."
              style={textareaStyle}
            />
          </label>

          <div style={twoColumnGridStyle}>
            <label style={fieldLabelStyle}>
              <span>Option A</span>
              <input
                value={form.optionA}
                onChange={(e) => updateField("optionA", e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={fieldLabelStyle}>
              <span>Option B</span>
              <input
                value={form.optionB}
                onChange={(e) => updateField("optionB", e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={fieldLabelStyle}>
              <span>Option C</span>
              <input
                value={form.optionC}
                onChange={(e) => updateField("optionC", e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={fieldLabelStyle}>
              <span>Option D</span>
              <input
                value={form.optionD}
                onChange={(e) => updateField("optionD", e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={fieldLabelStyle}>
              <span>Option E</span>
              <input
                value={form.optionE}
                onChange={(e) => updateField("optionE", e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={fieldLabelStyle}>
              <span>Correct Answer</span>
              <select
                value={form.correctAnswer}
                onChange={(e) =>
                  updateField("correctAnswer", e.target.value as OptionKey)
                }
                style={inputStyle}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </label>
          </div>

          <label style={fieldLabelStyle}>
            <span>Explanation</span>
            <textarea
              rows={5}
              value={form.explanation}
              onChange={(e) => updateField("explanation", e.target.value)}
              placeholder="Explain why the correct answer is right..."
              style={textareaStyle}
            />
          </label>

          <label style={fieldLabelStyle}>
            <span>Source</span>
            <input
              value={form.source}
              onChange={(e) => updateField("source", e.target.value)}
              placeholder="First Aid 2016, self-authored, etc."
              style={inputStyle}
            />
          </label>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="submit" disabled={saving} style={primaryButtonStyle}>
              {saving ? "Saving..." : "Create Question"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              style={secondaryButtonStyle}
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Recent Questions</h2>

        {loadingRecentQuestions ? (
          <p style={mutedTextStyle}>Loading recent questions...</p>
        ) : recentQuestions.length === 0 ? (
          <p style={mutedTextStyle}>No questions created yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {recentQuestions.map((question) => (
              <article key={question.id} style={recentQuestionCardStyle}>
                <div style={recentPathStyle}>
                  {question.subject_name} → {question.topic_name} →{" "}
                  {question.subtopic_name}
                </div>

                <div style={recentStemStyle}>{question.stem}</div>

                <div style={recentMetaStyle}>
                  Correct answer: {question.correct_answer} · Created:{" "}
                  {new Date(question.created_at).toLocaleString()}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const cardStyle: CSSProperties = {
  background: "#ffffff",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
};

const pageTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 8,
  color: "#0f172a"
};

const pageSubtitleStyle: CSSProperties = {
  marginTop: 0,
  color: "#475569"
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  color: "#0f172a"
};

const mutedTextStyle: CSSProperties = {
  color: "#475569"
};

const errorTextStyle: CSSProperties = {
  color: "#b91c1c",
  fontWeight: 600
};

const successTextStyle: CSSProperties = {
  color: "#166534",
  fontWeight: 600
};

const threeColumnGridStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))"
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))"
};

const fieldLabelStyle: CSSProperties = {
  display: "grid",
  gap: 6
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
  background: "#ffffff"
};

const textareaStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
  background: "#ffffff",
  resize: "vertical"
};

const pathCardStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16
};

const primaryButtonStyle: CSSProperties = {
  background: "#0f172a",
  color: "#ffffff",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  cursor: "pointer"
};

const secondaryButtonStyle: CSSProperties = {
  background: "#e2e8f0",
  color: "#0f172a",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  cursor: "pointer"
};

const recentQuestionCardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
  background: "#f8fafc"
};

const recentPathStyle: CSSProperties = {
  fontSize: 14,
  color: "#475569",
  marginBottom: 6
};

const recentStemStyle: CSSProperties = {
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: 8
};

const recentMetaStyle: CSSProperties = {
  fontSize: 13,
  color: "#64748b"
};