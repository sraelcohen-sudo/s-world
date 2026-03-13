import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(
  request: Request,
  { params }: { params: { subtopicId: string } }
) {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      stem,
      option_a,
      option_b,
      option_c,
      option_d,
      option_e
    FROM questions
    WHERE subtopic_id = $1
    `,
    [params.subtopicId]
  )

  return NextResponse.json(rows)
}