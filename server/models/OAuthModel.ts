import { Pool } from 'pg';
import { GithubUser, DbUser } from '../types/auth';

const pool = new Pool(); // Connection string is set in the environment variable

export class OAuthModel {
  async findOrCreateUser(githubUser: GithubUser): Promise<DbUser> {
    // First try to find the user by email
    const findResult = await pool.query(
      'SELECT * FROM user_account WHERE email = $1',
      [githubUser.email]
    );

    if (findResult.rows[0]) {
      // Update existing user's information if needed
      const updateResult = await pool.query(
        `UPDATE user_account 
         SET username = $1, first_name = $2
         WHERE email = $3
         RETURNING id, username, email, first_name`,
        [githubUser.login, githubUser.name, githubUser.email]
      );
      return updateResult.rows[0];
    }

    // Create new user if not found
    const insertResult = await pool.query(
      `INSERT INTO user_account (username, email, password, first_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, first_name`,
      [
        githubUser.login, 
        githubUser.email,
        'github-oauth', // placeholder password since they logged in via GitHub
        githubUser.name
      ]
    );

    return insertResult.rows[0];
  }

  async findUserById(id: number): Promise<DbUser | null> {
    const result = await pool.query(
      'SELECT id, username, email, first_name FROM user_account WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
}

export default new OAuthModel();