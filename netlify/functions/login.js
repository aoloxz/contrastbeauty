import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function handler(event) {
  try {
    const { email, password } = JSON.parse(event.body);

    const result = await sql`
      SELECT * FROM users WHERE email=${email} AND password=${password}
    `;

    if (result.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    return { statusCode: 200, body: JSON.stringify(result[0]) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
