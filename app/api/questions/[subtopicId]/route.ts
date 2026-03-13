import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  const { subtopicId } = await context.params;

  const { rows } = await pool.query(
    `
    SELECT
      id,
      stem,
      option_a,
      option_b,
      option_c,
      option_d,
      option_e,
      correct_answer,
      explanation
    FROM questions
    WHERE subtopic_id = $1
    ORDER BY created_at ASC
    `,
    [subtopicId]
  );

  return NextResponse.json(rows);
}