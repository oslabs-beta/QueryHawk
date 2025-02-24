// server/types/auth.ts

// export interface GithubTokenResponse {
//     access_token: string;
//     error?: string;
//     error_description?: string;
//   }

//   export interface GithubUser {
//     id: number;
//     login: string;
//     email: string;
//     name: string;
//     avatar_url: string;
//   }

//   export interface DbUser {
//     id: number;
//     username: string;
//     email: string;
//     first_name: string;
//     last_name: string;
//     github_id?: string;
//     user_id?: string;
//   }

//   export interface AuthenticatedUser {
//     id: number;
//     username: string;
//     email: string;
//     name: string;
//     avatarUrl: string | null;
//   }

export interface GithubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  [key: string]: any; // For any other properties GitHub might return
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface DbUser {
  id: number;
  username: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  github_id: string;
  user_id: string;
  [key: string]: any; // For any other fields from the database
}
