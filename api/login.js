import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    const result = await sql`
      SELECT * FROM users WHERE email=${email} AND password=${password}
    `;

    if (result.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.status(200).json(result[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
