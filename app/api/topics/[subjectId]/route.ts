import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await context.params;

  const { rows } = await pool.query(
    `
    SELECT id, name, description
    FROM topics
    WHERE subject_id = $1
    ORDER BY name
    `,
    [subjectId]
  );

  return NextResponse.json(rows);
}