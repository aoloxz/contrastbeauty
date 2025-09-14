import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password, about } = req.body;

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        about TEXT,
        visits INT DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const result = await sql`
      INSERT INTO users (name, email, password, about)
      VALUES (${name}, ${email}, ${password}, ${about})
      RETURNING id, name, email, about, visits, joined_at
    `;

    return res.status(200).json(result[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
