/**
 * Authentication Types
 * Local type definitions for authentication
 */

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    role?: string;
    [key: string]: any;
  };
}

export interface Session {
  access_token: string;
  user: User;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  } | null;
  error: AuthError | null;
}
