import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function handler(event) {
  try {
    const { client_name, client_email, gender, service, duration, price, date, time, status } = JSON.parse(event.body);
    await sql`CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      client_name TEXT,
      client_email TEXT,
      gender TEXT,
      service TEXT,
      duration INT,
      price TEXT,
      date DATE,
      time TEXT,
      status TEXT DEFAULT 'scheduled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    const rows = await sql`INSERT INTO bookings (client_name, client_email, gender, service, duration, price, date, time, status)
      VALUES (${client_name}, ${client_email}, ${gender}, ${service}, ${duration}, ${price}, ${date}, ${time}, ${status})
      RETURNING *`;
    return { statusCode: 200, body: JSON.stringify(rows[0]) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
