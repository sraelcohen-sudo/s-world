import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const query = `
      SELECT id, name
      FROM subjects
      ORDER BY name
    `;

    const { rows } = await pool.query(query);

    return NextResponse.json({
      success: true,
      subjects: rows,
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch subjects",
      },
      { status: 500 }
    );
  }
}