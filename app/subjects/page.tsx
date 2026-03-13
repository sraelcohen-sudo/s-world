"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Subject = {
  id: string;
  name: string;
};

type ApiResponse = {
  success: boolean;
  subjects: Subject[];
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch("/api/subjects");
        const data: ApiResponse = await res.json();

        if (!data.success) {
          throw new Error("Failed to load subjects");
        }

        setSubjects(data.subjects);
      } catch (err) {
        console.error(err);
        setError("Unable to load subjects.");
      } finally {
        setLoading(false);
      }
    }

    loadSubjects();
  }, []);

  if (loading) return <div>Loading subjects...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Subjects</h1>

      {subjects.map((s) => (
        <div key={s.id}>
          <Link href={`/subjects/${s.id}`}>{s.name}</Link>
        </div>
      ))}
    </div>
  );
}