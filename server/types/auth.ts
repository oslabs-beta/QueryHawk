// server/types/auth.ts

export interface GithubTokenResponse {
    access_token: string;
    error?: string;
    error_description?: string;
  }
  
  export interface GithubUser {
    id: number;
    login: string;
    email: string;
    name: string;
    avatar_url: string;
  }
  
  export interface DbUser {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    github_id?: string;
    user_id?: string;
  }
  
  export interface AuthenticatedUser {
    id: number;
    username: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  }