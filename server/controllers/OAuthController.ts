import { Request, Response } from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import OAuthModel from '../models/OAuthModel';
import {
  GithubTokenResponse,
  GithubUser,
  AuthenticatedUser,
} from '../types/auth';

const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const jwtSecret = process.env.JWT_SECRET;

interface CustomError extends Error {
  statusCode?: number;
}

interface DecodedToken {
  userId: number;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

class OAuthController {
  // Private method to handle errors consistently throughout the controller
  private createError(message: string, statusCode: number = 500): CustomError {
    const error: CustomError = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  // Private method to exchange the authorization code for an access token
  private async getAccessToken(code: string): Promise<string> {
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: githubClientId,
          client_secret: githubClientSecret,
          code: code,
        }),
      }
    );

    const tokenData = (await tokenResponse.json()) as GithubTokenResponse;

    // console.log('📟 GitHub token response:', {
    //   status: tokenResponse.status,
    //   error: tokenData.error,
    //   error_description: tokenData.error_description,
    // });

    if (tokenData.error) {
      throw this.createError(
        tokenData.error_description || 'Failed to exchange code for token',
        401
      );
    }

    if (!tokenData.access_token) {
      throw this.createError('No access token received from GitHub', 401);
    }

    return tokenData.access_token;
  }

  // Private method to fetch user data from GitHub using the access token
  private async getGithubUser(accessToken: string): Promise<GithubUser> {
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!userResponse.ok) {
      throw this.createError('Failed to fetch user data from GitHub', 401);
    }

    return userResponse.json() as Promise<GithubUser>;
  }

  // Private method to generate a JWT token for our authenticated user
  private generateToken(user: AuthenticatedUser): string {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET || '',
      { expiresIn: '24h' }
    );
  }

  // Public method to validate the JWT token
  public validateToken(token: string): DecodedToken {
    try {
      const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
      return decoded;
    } catch (error) {
      throw this.createError('Invalid token', 401);
    }
  }

  // Public method to handle the OAuth callback
  public async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, provider } = req.body;
      // console.log('🐸 Received request body:', req.body);

      // Validate input
      if (!code) {
        throw this.createError('Authorization code is required', 400);
      }

      if (provider !== 'github') {
        throw this.createError('Invalid provider', 400);
      }

      // Get the access token from GitHub
      const accessToken = await this.getAccessToken(code);

      // Get the user data from GitHub
      const githubUser = await this.getGithubUser(accessToken);

      // Persist or update the user in the database
      const user = await OAuthModel.findOrCreateUser(githubUser);

      // Create our authenticated user object
      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.first_name,
        avatarUrl: githubUser.avatar_url,
      };

      // Generate a session token
      const token = this.generateToken(authenticatedUser);

      // Send the response
      res.json({
        token,
        user: authenticatedUser,
      });
    } catch (error) {
      console.error('Authentication error:', error);
      const statusCode = (error as CustomError).statusCode || 500;
      res.status(statusCode).json({
        error: (error as Error).message || 'Authentication failed',
      });
    }
  }
  // Added method to get the current user
  public async getCurrentUser(userId: number): Promise<AuthenticatedUser> {
    try {
      const user = await OAuthModel.findUserById(userId);

      if (!user) {
        throw this.createError('User not found', 404);
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.first_name,
        // Since we don't have GitHub data here, we use a default avatar or null
        avatarUrl: null,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new OAuthController();
