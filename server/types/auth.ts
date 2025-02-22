export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export interface CustomError extends Error {
  statusCode?: number;
}
