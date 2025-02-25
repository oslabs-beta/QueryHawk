import pkg from 'pg';
const { Pool } = pkg;
import { GithubUser, DbUser } from '../types/auth.js';

// Initialize pool with Supabase configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase connections
  },
});

// Add connection error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export class OAuthModel {
  async findOrCreateUser(githubUser: GithubUser): Promise<DbUser> {
    console.log(
      '🔍 Connection string:',
      process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')
    );
    const client = await pool.connect();

    try {
      // Debug database connection
      console.log('🔌 Connected to database, running diagnostics...');

      // Get database name
      const dbNameResult = await client.query('SELECT current_database()');
      console.log(
        '📊 Current database:',
        dbNameResult.rows[0].current_database
      );

      // Get schema search path
      const schemaResult = await client.query('SHOW search_path');
      console.log('🔍 Search path:', schemaResult.rows[0].search_path);

      // Check if table exists
      const tableCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_account'
        );
      `);
      console.log(
        '📋 Does user_account table exist?',
        tableCheckResult.rows[0].exists
      );

      // Get current user
      const userResult = await client.query('SELECT current_user');
      console.log('👤 Connected as user:', userResult.rows[0].current_user);

      // List tables in public schema
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      console.log(
        '📑 Tables in public schema:',
        tablesResult.rows.map((r) => r.table_name)
      );

      await client.query('BEGIN');

      // First check if we have a user in the auth.users table with this GitHub email
      let authUserId = null;
      const sameEmailResult = await client.query(
        'SELECT id FROM auth.users WHERE email = $1',
        [githubUser.email]
      );

      if (sameEmailResult.rows.length > 0) {
        authUserId = sameEmailResult.rows[0].id;
        console.log('✅ Found existing auth user with same email:', authUserId);
      } else {
        // Create a new user in auth.users if none exists
        console.log(
          '🆕 Creating new auth user for GitHub user:',
          githubUser.login
        );

        const insertAuthUserResult = await client.query(
          `INSERT INTO auth.users (
            instance_id,
            id,
            aud, 
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
          )
          VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            $1,
            '',
            NOW(),
            null,
            NOW(),
            '{"provider": "github", "providers": ["github"]}',
            $2,
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
          )
          RETURNING id`,
          [
            githubUser.email,
            JSON.stringify({
              name: githubUser.name,
              avatar_url: githubUser.avatar_url,
              github_id: githubUser.id.toString(),
            }),
          ]
        );

        authUserId = insertAuthUserResult.rows[0].id;
        console.log('✅ Created new auth user with ID:', authUserId);
      }

      // Check if we have a user in user_account
      console.log(
        '🔍 Attempting to find user with GitHub ID:',
        githubUser.id.toString()
      );
      const findResult = await client.query(
        'SELECT * FROM user_account WHERE github_id = $1 OR email = $2',
        [githubUser.id.toString(), githubUser.email]
      );
      console.log('✅ Find result:', findResult.rows);

      if (findResult.rows[0]) {
        // Update existing user's information
        console.log('✅ Found existing user, updating...');
        const updateResult = await client.query(
          `UPDATE user_account 
           SET username = $1, 
               first_name = $2,
               last_name = $3,
               github_id = $4,
               email = COALESCE($5, email),
               user_id = $6
           WHERE id = $7
           RETURNING id, username, email, first_name, last_name, github_id, user_id`,
          [
            githubUser.login,
            githubUser.name?.split(' ')[0] || '', // First name
            githubUser.name?.split(' ').slice(1).join(' ') || '', // Last name
            githubUser.id.toString(),
            githubUser.email,
            authUserId,
            findResult.rows[0].id,
          ]
        );

        await client.query('COMMIT');
        return updateResult.rows[0];
      }

      // Create new user if not found
      const insertResult = await client.query(
        `INSERT INTO user_account (
          username, 
          email, 
          password, 
          first_name, 
          last_name,
          github_id,
          created_at,
          user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
        RETURNING id, username, email, first_name, last_name, github_id, user_id`,
        [
          githubUser.login,
          githubUser.email,
          'github-oauth',
          githubUser.name?.split(' ')[0] || '',
          githubUser.name?.split(' ').slice(1).join(' ') || '',
          githubUser.id.toString(),
          authUserId,
        ]
      );

      await client.query('COMMIT');
      return insertResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database error:', error);
      throw new Error('Failed to create or update user');
    } finally {
      client.release();
    }
  }

  async findUserById(id: number): Promise<DbUser | null> {
    try {
      const result = await pool.query(
        'SELECT id, username, email, first_name, last_name, github_id, user_id FROM user_account WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to find user');
    }
  }
}

export default new OAuthModel();
