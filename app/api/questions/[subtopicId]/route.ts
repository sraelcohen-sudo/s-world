import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type RouteParams = {
  params: {
    subtopicId: string;
  };
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { subtopicId } = params;

    const query = `
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
    `;

    const { rows } = await pool.query(query, [subtopicId]);

    return NextResponse.json({
      success: true,
      questions: rows,
    });

  } catch (error) {
    console.error("Error fetching questions:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch questions",
      },
      { status: 500 }
    );
  }
}