import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, status } = req.body;

    const rows = await sql`
      UPDATE bookings SET status=${status} WHERE id=${id} RETURNING *
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
