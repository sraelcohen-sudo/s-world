"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Discipline, ExamTrack } from "@/types/database";

export default function AdminDisciplinesDashboard() {
  const [tracks, setTracks] = useState<ExamTrack[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [loadingDisciplines, setLoadingDisciplines] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadTracks() {
    setLoadingTracks(true);
    setError("");

    const { data, error } = await supabase
      .from("exam_tracks")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
      setTracks([]);
      setLoadingTracks(false);
      return;
    }

    const loadedTracks = (data ?? []) as ExamTrack[];
    setTracks(loadedTracks);

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

    setLoadingTracks(false);
  }

  async function loadDisciplines() {
    setLoadingDisciplines(true);
    setError("");

    const { data, error } = await supabase
      .from("disciplines")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      setDisciplines([]);
      setLoadingDisciplines(false);
      return;
    }

    setDisciplines((data ?? []) as Discipline[]);
    setLoadingDisciplines(false);
  }

  async function loadAll() {
    await Promise.all([loadTracks(), loadDisciplines()]);
  }

  async function handleAddDiscipline(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const cleanName = name.trim();
    const cleanDescription = description.trim();

    if (!selectedTrackId) {
      setError("Please select an exam track.");
      setSaving(false);
      return;
    }

    if (!cleanName) {
      setError("Discipline name is required.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("disciplines").insert({
      exam_track_id: selectedTrackId,
      name: cleanName,
      description: cleanDescription || null
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setName("");
    setDescription("");
    setMessage("Discipline added successfully.");
    await loadDisciplines();
    setSaving(false);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const trackNameById = useMemo(() => {
    const map = new Map<string, string>();
    tracks.forEach((track) => map.set(track.id, track.name));
    return map;
  }, [tracks]);

  const visibleDisciplines = useMemo(() => {
    const visibleTrackIds = new Set(tracks.map((track) => track.id));

    return disciplines.filter(
      (discipline) =>
        discipline.exam_track_id !== null &&
        visibleTrackIds.has(discipline.exam_track_id)
    );
  }, [disciplines, tracks]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(320px, 420px) 1fr",
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
          Add Discipline
        </h2>

        <form onSubmit={handleAddDiscipline}>
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
            disabled={loadingTracks || tracks.length === 0}
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
            Discipline Name
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pediatrics"
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
            placeholder="Clinical assessment and management of children and adolescents"
            rows={5}
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
            {saving ? "Saving..." : "Add Discipline"}
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
            Existing Disciplines
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

        {loadingDisciplines ? (
          <p style={{ color: "#475569" }}>Loading disciplines...</p>
        ) : visibleDisciplines.length === 0 ? (
          <p style={{ color: "#475569" }}>No disciplines found for visible exam tracks.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "14px"
            }}
          >
            {visibleDisciplines.map((discipline) => (
              <article
                key={discipline.id}
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
                      {discipline.exam_track_id
                        ? trackNameById.get(discipline.exam_track_id) || "Unknown exam track"
                        : "No exam track"}
                    </p>

                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "20px",
                        color: "#0f172a"
                      }}
                    >
                      {discipline.name}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#475569",
                        lineHeight: 1.5
                      }}
                    >
                      {discipline.description || "No description provided."}
                    </p>
                  </div>

                  <span
                    style={{
                      backgroundColor: discipline.active ? "#dcfce7" : "#e2e8f0",
                      color: discipline.active ? "#166534" : "#475569",
                      borderRadius: "999px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {discipline.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}