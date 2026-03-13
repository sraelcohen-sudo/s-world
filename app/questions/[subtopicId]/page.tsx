"use client"

import { useEffect, useState } from "react"

export default function QuestionPage({ params }: any) {
  const [questions, setQuestions] = useState([])

  useEffect(() => {
    fetch(`/api/questions/${params.subtopicId}`)
      .then(res => res.json())
      .then(setQuestions)
  }, [])

  if (!questions.length) return <div>Loading...</div>

  const q = questions[0]

  return (
    <div>
      <h2>{q.stem}</h2>

      <button>{q.option_a}</button>
      <button>{q.option_b}</button>
      <button>{q.option_c}</button>
      <button>{q.option_d}</button>
      <button>{q.option_e}</button>
    </div>
  )
}