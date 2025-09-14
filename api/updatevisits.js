import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, delta } = req.body;

    const result = await sql`
      UPDATE users SET visits = visits + ${delta}
      WHERE email=${email}
      RETURNING id, name, email, visits
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(result[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
