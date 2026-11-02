require('dotenv').config();
const { Client } = require('pg');

async function createAdmin() {
  const rawUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_MQvRIeE8u1NP@ep-bitter-bar-ahyodkz1-pooler.c-3.us-east-1.aws.neon.tech/neondb";
  const connectionString = rawUrl.includes('?') ? `${rawUrl}&sslmode=verify-full` : `${rawUrl}?sslmode=verify-full`;
  const client = new Client({
    connectionString: rawUrl.replace(/[?&]sslmode=[^&]+/, ''),
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const email = 'vinaysharma31681@gmail.com';
    
    // Check if user exists
    const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (res.rows.length > 0) {
      // Update role to admin
      await client.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
      console.log(`Updated existing user ${email} to ADMIN role.`);
    } else {
      // Insert new admin user
      await client.query(`
        INSERT INTO users (email, name, role, email_verified) 
        VALUES ($1, $2, 'admin', true)
      `, [email, 'Vinay Admin']);
      console.log(`Created new ADMIN user: ${email}`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

createAdmin();
