import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type RouteContext = {
  params: Promise<{
    subjectId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { subjectId } = await params;

    const query = `
      SELECT
        id,
        name,
        subject_id
      FROM topics
      WHERE subject_id = $1
      ORDER BY name ASC
    `;

    const { rows } = await pool.query(query, [subjectId]);

    return NextResponse.json({
      success: true,
      topics: rows,
    });
  } catch (error) {
    console.error("Error fetching topics:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch topics",
      },
      { status: 500 }
    );
  }
}