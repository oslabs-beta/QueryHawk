import pg from 'pg';
import { AuthenticatedUser } from '../types/auth';

const { Pool } = pg;

class OAuthModel {
  private pool: InstanceType<typeof Pool>;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  async findOrCreateUser(githubUser: {
    id: number;
    login: string;
    email: string;
    name: string;
    avatar_url: string;
  }): Promise<AuthenticatedUser> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Check if user exists
      const existingUser = await client.query(
        'SELECT * FROM users WHERE github_id = $1',
        [githubUser.id]
      );

      if (existingUser.rows.length > 0) {
        // Update existing user
        const updatedUser = await client.query(
          `UPDATE users 
           SET username = $1, email = $2, name = $3, avatar_url = $4, updated_at = NOW()
           WHERE github_id = $5
           RETURNING id, username, email, name, avatar_url`,
          [
            githubUser.login,
            githubUser.email,
            githubUser.name,
            githubUser.avatar_url,
            githubUser.id,
          ]
        );

        await client.query('COMMIT');
        return updatedUser.rows[0];
      }

      // Create new user
      const newUser = await client.query(
        `INSERT INTO users (github_id, username, email, name, avatar_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, username, email, name, avatar_url`,
        [
          githubUser.id,
          githubUser.login,
          githubUser.email,
          githubUser.name,
          githubUser.avatar_url,
        ]
      );

      await client.query('COMMIT');
      return newUser.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserById(id: number): Promise<AuthenticatedUser | null> {
    const result = await this.pool.query(
      'SELECT id, username, email, name, avatar_url FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }
}

export default new OAuthModel();
