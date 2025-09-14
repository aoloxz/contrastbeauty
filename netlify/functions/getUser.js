import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function handler(event) {
  try {
    const email = event.queryStringParameters.email;

    const result = await sql`
      SELECT * FROM users WHERE email=${email}
    `;

    if (result.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "User not found" }) };
    }

    return { statusCode: 200, body: JSON.stringify(result[0]) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
