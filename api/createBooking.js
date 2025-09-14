import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { client_name, client_email, gender, service, duration, price, date, time, status } = req.body;

    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
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
      )
    `;

    const rows = await sql`
      INSERT INTO bookings (client_name, client_email, gender, service, duration, price, date, time, status)
      VALUES (${client_name}, ${client_email}, ${gender}, ${service}, ${duration}, ${price}, ${date}, ${time}, ${status})
      RETURNING *
    `;

    return res.status(200).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
