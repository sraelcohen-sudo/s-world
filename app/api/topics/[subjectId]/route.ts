import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(
  request: Request,
  { params }: { params: { subjectId: string } }
) {
  const { rows } = await pool.query(
    `
    SELECT id, name
    FROM topics
    WHERE subject_id = $1
    ORDER BY name
    `,
    [params.subjectId]
  )

  return NextResponse.json(rows)
}