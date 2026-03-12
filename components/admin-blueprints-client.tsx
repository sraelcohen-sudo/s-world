"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Blueprint, Competency, Discipline, ExamTrack } from "@/types/database";

export default function AdminBlueprintsClient() {
  const [tracks, setTracks] = useState<ExamTrack[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);

  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedDisciplineId, setSelectedDisciplineId] = useState("");
  const [selectedCompetencyId, setSelectedCompetencyId] = useState("");
  const [targetPercent, setTargetPercent] = useState("");

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
      blueprintsResult
    ] = await Promise.all([
      supabase.from("exam_tracks").select("*").order("name", { ascending: true }),
      supabase.from("disciplines").select("*").order("name", { ascending: true }),
      supabase.from("competencies").select("*").order("name", { ascending: true }),
      supabase.from("blueprints").select("*").order("created_at", { ascending: true })
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

    if (blueprintsResult.error) {
      setError(blueprintsResult.error.message);
      setLoading(false);
      return;
    }

    const loadedTracks = (tracksResult.data ?? []) as ExamTrack[];
    const loadedDisciplines = (disciplinesResult.data ?? []) as Discipline[];
    const loadedCompetencies = (competenciesResult.data ?? []) as Competency[];
    const loadedBlueprints = (blueprintsResult.data ?? []) as Blueprint[];

    setTracks(loadedTracks);
    setDisciplines(loadedDisciplines);
    setCompetencies(loadedCompetencies);
    setBlueprints(loadedBlueprints);

    if (!selectedTrackId && loadedTracks.length > 0) {
      setSelectedTrackId(loadedTracks[0].id);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredDisciplines = useMemo(() => {
    if (!selectedTrackId) return [];
    return disciplines.filter((discipline) => discipline.exam_track_id === selectedTrackId);
  }, [disciplines, selectedTrackId]);

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

  const filteredCompetencies = useMemo(() => {
    if (!selectedDisciplineId) return [];
    return competencies.filter(
      (competency) => competency.discipline_id === selectedDisciplineId
    );
  }, [competencies, selectedDisciplineId]);

  useEffect(() => {
    if (filteredCompetencies.length === 0) {
      setSelectedCompetencyId("");
      return;
    }

    const stillExists = filteredCompetencies.some(
      (competency) => competency.id === selectedCompetencyId
    );

    if (!stillExists) {
      setSelectedCompetencyId(filteredCompetencies[0].id);
    }
  }, [filteredCompetencies, selectedCompetencyId]);

  const disciplineNameById = useMemo(() => {
    const map = new Map<string, string>();
    disciplines.forEach((discipline) => map.set(discipline.id, discipline.name));
    return map;
  }, [disciplines]);

  const competencyNameById = useMemo(() => {
    const map = new Map<string, string>();
    competencies.forEach((competency) => map.set(competency.id, competency.name));
    return map;
  }, [competencies]);

  const trackNameById = useMemo(() => {
    const map = new Map<string, string>();
    tracks.forEach((track) => map.set(track.id, track.name));
    return map;
  }, [tracks]);

  const currentBlueprints = useMemo(() => {
    return blueprints.filter(
      (blueprint) =>
        blueprint.exam_track_id === selectedTrackId &&
        blueprint.discipline_id === selectedDisciplineId
    );
  }, [blueprints, selectedTrackId, selectedDisciplineId]);

  const currentTotal = useMemo(() => {
    return currentBlueprints.reduce(
      (sum, blueprint) => sum + Number(blueprint.target_percent ?? 0),
      0
    );
  }, [currentBlueprints]);

  async function handleAddBlueprint(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const parsedPercent = Number(targetPercent);

    if (!selectedTrackId) {
      setError("Please select an exam track.");
      setSaving(false);
      return;
    }

    if (!selectedDisciplineId) {
      setError("Please select a discipline.");
      setSaving(false);
      return;
    }

    if (!selectedCompetencyId) {
      setError("Please select a competency.");
      setSaving(false);
      return;
    }

    if (Number.isNaN(parsedPercent) || parsedPercent <= 0 || parsedPercent > 100) {
      setError("Target percent must be a number greater than 0 and not more than 100.");
      setSaving(false);
      return;
    }

    const alreadyExists = currentBlueprints.some(
      (blueprint) => blueprint.competency_id === selectedCompetencyId
    );

    if (alreadyExists) {
      setError("That competency already has a blueprint entry for this discipline.");
      setSaving(false);
      return;
    }

    const newTotal = currentTotal + parsedPercent;
    if (newTotal > 100) {
      setError(`This would bring the total to ${newTotal}%. A blueprint cannot exceed 100%.`);
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("blueprints").insert({
      exam_track_id: selectedTrackId,
      discipline_id: selectedDisciplineId,
      competency_id: selectedCompetencyId,
      target_percent: parsedPercent
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setTargetPercent("");
    setMessage("Blueprint entry added successfully.");
    await loadAll();
    setSaving(false);
  }

  async function handleDeleteBlueprint(id: string) {
    setMessage("");
    setError("");

    const { error } = await supabase.from("blueprints").delete().eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Blueprint entry deleted.");
    await loadAll();
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(340px, 460px) 1fr",
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
          Add Blueprint Entry
        </h2>

        <form onSubmit={handleAddBlueprint}>
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
              <option value="">No exam tracks available</option>
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
              <option value="">No disciplines available for this track</option>
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
            Competency
          </label>

          <select
            value={selectedCompetencyId}
            onChange={(e) => setSelectedCompetencyId(e.target.value)}
            disabled={filteredCompetencies.length === 0}
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
            {filteredCompetencies.length === 0 ? (
              <option value="">No competencies available for this discipline</option>
            ) : (
              filteredCompetencies.map((competency) => (
                <option key={competency.id} value={competency.id}>
                  {competency.name}
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
            Target Percent
          </label>

          <input
            type="number"
            min="1"
            max="100"
            step="1"
            value={targetPercent}
            onChange={(e) => setTargetPercent(e.target.value)}
            placeholder="15"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
              marginBottom: "16px"
            }}
          />

          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              color: "#334155",
              fontSize: "14px",
              fontWeight: 700
            }}
          >
            Current total for this discipline: {currentTotal}%
          </div>

          <button
            type="submit"
            disabled={saving || !selectedTrackId || !selectedDisciplineId || !selectedCompetencyId}
            style={{
              backgroundColor:
                saving || !selectedTrackId || !selectedDisciplineId || !selectedCompetencyId
                  ? "#94a3b8"
                  : "#0f2d69",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 18px",
              fontWeight: 700,
              cursor:
                saving || !selectedTrackId || !selectedDisciplineId || !selectedCompetencyId
                  ? "not-allowed"
                  : "pointer"
            }}
          >
            {saving ? "Saving..." : "Add Blueprint Entry"}
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
          <div>
            <h2
              style={{
                margin: 0,
                color: "#0f2d69"
              }}
            >
              Current Blueprint
            </h2>
            <p
              style={{
                margin: "8px 0 0 0",
                color: "#475569"
              }}
            >
              {selectedTrackId && selectedDisciplineId
                ? `${trackNameById.get(selectedTrackId) || "Track"} → ${
                    disciplineNameById.get(selectedDisciplineId) || "Discipline"
                  }`
                : "Select a track and discipline to view blueprint entries."}
            </p>
          </div>

          <button
            onClick={loadAll}
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
          <p style={{ color: "#475569" }}>Loading blueprint data...</p>
        ) : currentBlueprints.length === 0 ? (
          <p style={{ color: "#475569" }}>No blueprint entries found for this discipline.</p>
        ) : (
          <>
            <div
              style={{
                marginBottom: "16px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap"
              }}
            >
              <span
                style={{
                  backgroundColor: currentTotal === 100 ? "#dcfce7" : "#fef3c7",
                  color: currentTotal === 100 ? "#166534" : "#92400e",
                  borderRadius: "999px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: 700
                }}
              >
                Total: {currentTotal}%
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gap: "14px"
              }}
            >
              {currentBlueprints.map((blueprint) => (
                <article
                  key={blueprint.id}
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
                      gap: "12px",
                      alignItems: "start",
                      flexWrap: "wrap"
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
                        {trackNameById.get(blueprint.exam_track_id) || "Unknown track"} →{" "}
                        {blueprint.discipline_id
                          ? disciplineNameById.get(blueprint.discipline_id) || "Unknown discipline"
                          : "No discipline"}
                      </p>

                      <h3
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "20px",
                          color: "#0f172a"
                        }}
                      >
                        {blueprint.competency_id
                          ? competencyNameById.get(blueprint.competency_id) || "Unknown competency"
                          : "No competency"}
                      </h3>

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
                        Target: {blueprint.target_percent}%
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteBlueprint(blueprint.id)}
                      style={{
                        backgroundColor: "#fee2e2",
                        color: "#b91c1c",
                        border: "none",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}