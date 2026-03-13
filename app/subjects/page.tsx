"use client"

import { useEffect, useState } from "react"

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])

  useEffect(() => {
    fetch("/api/subjects")
      .then(res => res.json())
      .then(setSubjects)
  }, [])

  return (
    <div>
      <h1>Subjects</h1>

      {subjects.map((s: any) => (
        <div key={s.id}>
          <a href={`/subjects/${s.id}`}>{s.name}</a>
        </div>
      ))}
    </div>
  )
}