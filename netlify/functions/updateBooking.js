import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function handler(event) {
  try {
    const { id, status } = JSON.parse(event.body);
    const rows = await sql`UPDATE bookings SET status=${status} WHERE id=${id} RETURNING *`;
    return rows.length
      ? { statusCode: 200, body: JSON.stringify(rows[0]) }
      : { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
