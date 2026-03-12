"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Discipline } from "@/types/database";

type Competency = {
  id: string;
  discipline_id: string;
  name: string;
  description: string | null;
  threshold_percent: number;
  minimum_questions: number;
  active: boolean;
  created_at: string;
};

export default function AdminCompetenciesClient() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [thresholdPercent, setThresholdPercent] = useState("70");
  const [minimumQuestions, setMinimumQuestions] = useState("10");
  const [loadingDisciplines, setLoadingDisciplines] = useState(true);
  const [loadingCompetencies, setLoadingCompetencies] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadDisciplines() {
    setLoadingDisciplines(true);
    setError("");

    const { data, error } = await supabase
      .from("disciplines")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
      setDisciplines([]);
      setLoadingDisciplines(false);
      return;
    }

    const loadedDisciplines = (data ?? []) as Discipline[];
    setDisciplines(loadedDisciplines);

    if (!selectedDisciplineId && loadedDisciplines.length > 0) {
      setSelectedDisciplineId(loadedDisciplines[0].id);
    }

    setLoadingDisciplines(false);
  }

  async function loadCompetencies() {
    setLoadingCompetencies(true);
    setError("");

    const { data, error } = await supabase
      .from("competencies")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      setCompetencies([]);
      setLoadingCompetencies(false);
      return;
    }

    setCompetencies((data ?? []) as Competency[]);
    setLoadingCompetencies(false);
  }

  async function handleAddCompetency(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const cleanName = name.trim();
    const cleanDescription = description.trim();
    const parsedThreshold = Number(thresholdPercent);
    const parsedMinimumQuestions = Number(minimumQuestions);

    if (!selectedDisciplineId) {
      setError("Please select a discipline.");
      setSaving(false);
      return;
    }

    if (!cleanName) {
      setError("Competency name is required.");
      setSaving(false);
      return;
    }

    if (Number.isNaN(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > 100) {
      setError("Threshold percent must be a number between 0 and 100.");
      setSaving(false);
      return;
    }

    if (
      Number.isNaN(parsedMinimumQuestions) ||
      parsedMinimumQuestions < 1 ||
      !Number.isInteger(parsedMinimumQuestions)
    ) {
      setError("Minimum questions must be a whole number greater than 0.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("competencies").insert({
      discipline_id: selectedDisciplineId,
      name: cleanName,
      description: cleanDescription || null,
      threshold_percent: parsedThreshold,
      minimum_questions: parsedMinimumQuestions
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setName("");
    setDescription("");
    setThresholdPercent("70");
    setMinimumQuestions("10");
    setMessage("Competency added successfully.");
    await loadCompetencies();
    setSaving(false);
  }

  useEffect(() => {
    loadDisciplines();
    loadCompetencies();
  }, []);

  const disciplineNameById = useMemo(() => {
    const map = new Map<string, string>();
    disciplines.forEach((discipline) => map.set(discipline.id, discipline.name));
    return map;
  }, [disciplines]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(320px, 440px) 1fr",
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
        <h2
          style={{
            marginTop: 0,
            marginBottom: "16px",
            color: "#0f2d69"
          }}
        >
          Add Competency
        </h2>

        <form onSubmit={handleAddCompetency}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "8px"
            }}
          >
            Discipline
          </label>

          <select
            value={selectedDisciplineId}
            onChange={(e) => setSelectedDisciplineId(e.target.value)}
            disabled={loadingDisciplines || disciplines.length === 0}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
              marginBottom: "16px",
              backgroundColor: "#fff"
            }}
          >
            {disciplines.length === 0 ? (
              <option value="">No disciplines available</option>
            ) : (
              disciplines.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </option>
              ))
            )}
          </select>

          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "8px"
            }}
          >
            Competency Name
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Neonatology"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
              marginBottom: "16px"
            }}
          />

          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "8px"
            }}
          >
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Assessment and management of newborn conditions and neonatal care"
            rows={4}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
              marginBottom: "16px",
              resize: "vertical"
            }}
          />

          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "8px"
            }}
          >
            Threshold Percent
          </label>

          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={thresholdPercent}
            onChange={(e) => setThresholdPercent(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
              marginBottom: "16px"
            }}
          />

          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "8px"
            }}
          >
            Minimum Questions
          </label>

          <input
            type="number"
            min="1"
            step="1"
            value={minimumQuestions}
            onChange={(e) => setMinimumQuestions(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
              marginBottom: "16px"
            }}
          />

          <button
            type="submit"
            disabled={saving || disciplines.length === 0}
            style={{
              backgroundColor: saving || disciplines.length === 0 ? "#94a3b8" : "#0f2d69",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 18px",
              fontWeight: 700,
              cursor: saving || disciplines.length === 0 ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Saving..." : "Add Competency"}
          </button>
        </form>

        {message ? (
          <p
            style={{
              marginTop: "16px",
              color: "#166534",
              fontWeight: 700
            }}
          >
            {message}
          </p>
        ) : null}

        {error ? (
          <p
            style={{
              marginTop: "16px",
              color: "#b91c1c",
              fontWeight: 700
            }}
          >
            {error}
          </p>
        ) : null}
      </section>

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
            marginBottom: "20px",
            gap: "12px",
            flexWrap: "wrap"
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#0f2d69"
            }}
          >
            Existing Competencies
          </h2>

          <button
            onClick={loadCompetencies}
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

        {loadingCompetencies ? (
          <p style={{ color: "#475569" }}>Loading competencies...</p>
        ) : competencies.length === 0 ? (
          <p style={{ color: "#475569" }}>No competencies found.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "14px"
            }}
          >
            {competencies.map((competency) => (
              <article
                key={competency.id}
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
                    gap: "12px"
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: "0 0 6px 0",
                        color: "#64748b",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      {disciplineNameById.get(competency.discipline_id) || "Unknown discipline"}
                    </p>

                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "20px",
                        color: "#0f172a"
                      }}
                    >
                      {competency.name}
                    </h3>

                    <p
                      style={{
                        margin: "0 0 10px 0",
                        color: "#475569",
                        lineHeight: 1.5
                      }}
                    >
                      {competency.description || "No description provided."}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap"
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          borderRadius: "999px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: 700
                        }}
                      >
                        Threshold: {competency.threshold_percent}%
                      </span>

                      <span
                        style={{
                          backgroundColor: "#f8fafc",
                          color: "#334155",
                          borderRadius: "999px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: 700
                        }}
                      >
                        Minimum Questions: {competency.minimum_questions}
                      </span>

                      <span
                        style={{
                          backgroundColor: competency.active ? "#dcfce7" : "#e2e8f0",
                          color: competency.active ? "#166534" : "#475569",
                          borderRadius: "999px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: 700
                        }}
                      >
                        {competency.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}