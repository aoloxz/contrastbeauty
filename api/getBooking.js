import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;

    const rows = email
      ? await sql`SELECT * FROM bookings WHERE client_email=${email} ORDER BY date,time`
      : await sql`SELECT * FROM bookings ORDER BY date,time`;

    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
