"use client";

import { useEffect, useState } from "react";

type Question = {
  id: string;
  stem: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  correct_answer?: string;
  explanation?: string | null;
};

type ApiResponse = {
  success: boolean;
  questions: Question[];
};

export default function QuestionPracticePage({
  params,
}: {
  params: { subtopicId: string };
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch(`/api/questions/${params.subtopicId}`);
        const data: ApiResponse = await res.json();

        if (!data.success) {
          throw new Error("Failed to load questions");
        }

        setQuestions(data.questions);
      } catch (err) {
        setError("Unable to load questions.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [params.subtopicId]);

  if (loading) return <div>Loading questions...</div>;
  if (error) return <div>{error}</div>;
  if (questions.length === 0) return <div>No questions found.</div>;

  const q = questions[0];

  return (
    <div>
      <h2>{q.stem}</h2>

      {q.option_a && <button>{q.option_a}</button>}
      {q.option_b && <button>{q.option_b}</button>}
      {q.option_c && <button>{q.option_c}</button>}
      {q.option_d && <button>{q.option_d}</button>}
      {q.option_e && <button>{q.option_e}</button>}
    </div>
  );
}