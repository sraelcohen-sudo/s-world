import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";
import { query } from "@/lib/db";

type SubjectRow = {
  id: string;
  name: string;
};

type TopicRow = {
  id: string;
  name: string;
  subject_id: string;
};

type PageProps = {
  params: Promise<{
    subjectId: string;
  }>;
};

export default async function SubjectDetailPage({ params }: PageProps) {
  const { subjectId } = await params;

  const subjects = await query<SubjectRow>(
    `
      SELECT id, name
      FROM subjects
      WHERE id = $1
      LIMIT 1
    `,
    [subjectId]
  );

  if (subjects.length === 0) {
    notFound();
  }

  const subject = subjects[0];

  const topics = await query<TopicRow>(
    `
      SELECT id, name, subject_id
      FROM topics
      WHERE subject_id = $1
      ORDER BY name ASC
    `,
    [subjectId]
  );

  return (
    <main style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href={"/subjects" as Route}>← Back to Subjects</Link>
      </div>

      <h1 style={{ marginBottom: "0.5rem" }}>{subject.name}</h1>
      <p style={{ marginBottom: "1.5rem", color: "#666" }}>
        Browse topics for this subject.
      </p>

      {topics.length === 0 ? (
        <p>No topics found for this subject yet.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}` as Route}
              style={{
                display: "block",
                padding: "1rem",
                border: "1px solid #ddd",
                borderRadius: "12px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {topic.name}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}