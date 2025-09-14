import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function handler(event) {
  try {
    const email = event.queryStringParameters?.email;
    const rows = email
      ? await sql`SELECT * FROM bookings WHERE client_email=${email} ORDER BY date,time`
      : await sql`SELECT * FROM bookings ORDER BY date,time`;
    return { statusCode: 200, body: JSON.stringify(rows) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
