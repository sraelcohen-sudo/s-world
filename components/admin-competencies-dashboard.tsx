"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Competency, Discipline, ExamTrack } from "@/types/database";

export default function AdminCompetenciesDashboard() {
  const [tracks, setTracks] = useState<ExamTrack[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);

  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedDisciplineId, setSelectedDisciplineId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [thresholdPercent, setThresholdPercent] = useState("70");
  const [minimumQuestions, setMinimumQuestions] = useState("10");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");

    const [tracksResult, disciplinesResult, competenciesResult] =
      await Promise.all([
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
          .order("created_at", { ascending: true })
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

    const loadedTracks = (tracksResult.data ?? []) as ExamTrack[];
    const loadedDisciplines = (disciplinesResult.data ?? []) as Discipline[];
    const loadedCompetencies = (competenciesResult.data ?? []) as Competency[];

    setTracks(loadedTracks);
    setDisciplines(loadedDisciplines);
    setCompetencies(loadedCompetencies);

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
    if (!selectedTrackId) return [];

    return visibleDisciplines.filter(
      (discipline) => discipline.exam_track_id === selectedTrackId
    );
  }, [visibleDisciplines, selectedTrackId]);

  useEffect(() => {
    if (filteredDisciplines.length === 0) {
      setSelectedDisciplineId("");
      return;
    }

    const stillExists = filteredDisciplines.some(
      (discipline) => discipline.id === selectedDisciplineId
    );

    if (!stillExists) {
      setSelectedDisciplineId(filteredDisciplines[0].id);
    }
  }, [filteredDisciplines, selectedDisciplineId]);

  const visibleDisciplineIds = useMemo(() => {
    return new Set(visibleDisciplines.map((discipline) => discipline.id));
  }, [visibleDisciplines]);

  const visibleCompetencies = useMemo(() => {
    return competencies.filter((competency) =>
      visibleDisciplineIds.has(competency.discipline_id)
    );
  }, [competencies, visibleDisciplineIds]);

  const disciplineNameById = useMemo(() => {
    const map = new Map<string, string>();
    visibleDisciplines.forEach((discipline) => {
      map.set(discipline.id, discipline.name);
    });
    return map;
  }, [visibleDisciplines]);

  async function handleAddCompetency(e: React.FormEvent<HTMLFormElement>) {
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

    const { error: insertError } = await supabase.from("competencies").insert({
      discipline_id: selectedDisciplineId,
      name: cleanName,
      description: cleanDescription || null,
      threshold_percent: parsedThreshold,
      minimum_questions: parsedMinimumQuestions
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setName("");
    setDescription("");
    setThresholdPercent("70");
    setMinimumQuestions("10");
    setMessage("Competency added successfully.");
    await loadAll();
    setSaving(false);
  }

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
            Exam Track
          </label>

          <select
            value={selectedTrackId}
            onChange={(e) => setSelectedTrackId(e.target.value)}
            disabled={loading || tracks.length === 0}
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
            disabled={filteredDisciplines.length === 0}
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
            {filteredDisciplines.length === 0 ? (
              <option value="">No disciplines available for this visible track</option>
            ) : (
              filteredDisciplines.map((discipline) => (
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
            disabled={saving || filteredDisciplines.length === 0}
            style={{
              backgroundColor:
                saving || filteredDisciplines.length === 0 ? "#94a3b8" : "#0f2d69",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 18px",
              fontWeight: 700,
              cursor:
                saving || filteredDisciplines.length === 0 ? "not-allowed" : "pointer"
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
            onClick={() => {
              void loadAll();
            }}
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

        {loading ? (
          <p style={{ color: "#475569" }}>Loading competencies...</p>
        ) : visibleCompetencies.length === 0 ? (
          <p style={{ color: "#475569" }}>
            No competencies found for visible exam tracks.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "14px"
            }}
          >
            {visibleCompetencies.map((competency) => (
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
                      {disciplineNameById.get(competency.discipline_id) ||
                        "Unknown discipline"}
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