//npx tsx test-connection.ts to test the database connection
import pkg from 'pg';
const { Pool } = pkg;

// Try connection with preferred credentials
const pool = new Pool({
  user: "postgres.zfbgkhgpvwqjicxwhhoc",
  password: "PxqpCoWA5BIfcD6z", 
  host: "aws-0-us-east-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  ssl: { 
    rejectUnauthorized: false,
    // Try adding these parameters to make SCRAM authentication work
    secureOptions: 0,
    // Add TLS protocols that might help with SCRAM authentication
    minVersion: 'TLSv1.2'
  }
});

async function testConnection(): Promise<void> {
  try {
    console.log('Attempting to connect to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('🕒 Database time:', result.rows[0].now);
    
    client.release();
  } catch (err) {
    console.error('❌ Connection failed:', err);
    console.error('Error details:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();