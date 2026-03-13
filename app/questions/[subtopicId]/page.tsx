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

export default function QuestionPage({
  params,
}: {
  params: { subtopicId: string };
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuestions() {
      const res = await fetch(`/api/questions/${params.subtopicId}`);
      const data: Question[] = await res.json();
      setQuestions(data);
      setLoading(false);
    }

    loadQuestions();
  }, [params.subtopicId]);

  if (loading) return <div>Loading...</div>;
  if (questions.length === 0) return <div>No questions found.</div>;

  const q = questions[0];

  return (
    <div>
      <h2>{q.stem}</h2>

      <button>{q.option_a}</button>
      <button>{q.option_b}</button>
      <button>{q.option_c}</button>
      <button>{q.option_d}</button>
      <button>{q.option_e}</button>
    </div>
  );
}