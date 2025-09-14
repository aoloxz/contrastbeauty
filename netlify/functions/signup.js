import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function handler(event) {
  try {
    const { name, email, password, about } = JSON.parse(event.body);

    // Creează tabelul dacă nu există
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

    // Inserează user nou
    const result = await sql`
      INSERT INTO users (name, email, password, about)
      VALUES (${name}, ${email}, ${password}, ${about})
      RETURNING id, name, email, about, visits, joined_at
    `;

    return { statusCode: 200, body: JSON.stringify(result[0]) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
