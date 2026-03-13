"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ExamTrack } from "@/types/database";

export default function AdminTaxonomyDashboard() {
  const [tracks, setTracks] = useState<ExamTrack[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadTracks() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("exam_tracks")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      setTracks([]);
      setLoading(false);
      return;
    }

    setTracks((data ?? []) as ExamTrack[]);
    setLoading(false);
  }

  async function handleAddTrack(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const cleanName = name.trim();
    const cleanDescription = description.trim();

    if (!cleanName) {
      setError("Exam track name is required.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("exam_tracks").insert({
      name: cleanName,
      description: cleanDescription || null,
      active: true
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setName("");
    setDescription("");
    setMessage("Exam track added successfully.");
    await loadTracks();
    setSaving(false);
  }

  async function handleToggleTrackVisibility(
    trackId: string,
    nextActiveValue: boolean
  ) {
    setMessage("");
    setError("");

    const { error } = await supabase
      .from("exam_tracks")
      .update({ active: nextActiveValue })
      .eq("id", trackId);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      nextActiveValue ? "Exam track is now visible." : "Exam track is now hidden."
    );
    await loadTracks();
  }

  useEffect(() => {
    void loadTracks();
  }, []);

  const activeCount = useMemo(
    () => tracks.filter((track) => track.active).length,
    [tracks]
  );

  const hiddenCount = useMemo(
    () => tracks.filter((track) => !track.active).length,
    [tracks]
  );

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
          Add Exam Track
        </h2>

        <form onSubmit={handleAddTrack}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "8px"
            }}
          >
            Track Name
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="USMLE Step 3"
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
            placeholder="Clinical knowledge and management examination"
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
            disabled={saving}
            style={{
              backgroundColor: saving ? "#94a3b8" : "#0f2d69",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 18px",
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Saving..." : "Add Exam Track"}
          </button>
        </form>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >
          <span
            style={{
              backgroundColor: "#dcfce7",
              color: "#166534",
              borderRadius: "999px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 700
            }}
          >
            Visible: {activeCount}
          </span>

          <span
            style={{
              backgroundColor: "#f1f5f9",
              color: "#475569",
              borderRadius: "999px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 700
            }}
          >
            Hidden: {hiddenCount}
          </span>
        </div>

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
              Existing Exam Tracks
            </h2>

            <p
              style={{
                margin: "8px 0 0 0",
                color: "#475569"
              }}
            >
              Hidden exam tracks will disappear from the discipline, competency,
              blueprint, and authoring screens.
            </p>
          </div>

          <button
            onClick={() => {
              void loadTracks();
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
          <p style={{ color: "#475569" }}>Loading exam tracks...</p>
        ) : tracks.length === 0 ? (
          <p style={{ color: "#475569" }}>No exam tracks found.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "14px"
            }}
          >
            {tracks.map((track) => (
              <article
                key={track.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px",
                  opacity: track.active ? 1 : 0.72
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
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "20px",
                        color: "#0f172a"
                      }}
                    >
                      {track.name}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#475569",
                        lineHeight: 1.5
                      }}
                    >
                      {track.description || "No description provided."}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "flex-end"
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: track.active ? "#dcfce7" : "#f1f5f9",
                        color: track.active ? "#166534" : "#475569",
                        borderRadius: "999px",
                        padding: "6px 10px",
                        fontSize: "12px",
                        fontWeight: 700,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {track.active ? "Visible" : "Hidden"}
                    </span>

                    <button
                      onClick={() => {
                        void handleToggleTrackVisibility(track.id, !track.active);
                      }}
                      style={{
                        backgroundColor: track.active ? "#fee2e2" : "#dcfce7",
                        color: track.active ? "#b91c1c" : "#166534",
                        border: "none",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {track.active ? "Hide" : "Show"}
                    </button>
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