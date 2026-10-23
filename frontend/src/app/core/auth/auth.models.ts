export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  role: string;
}

export interface Session {
  token: string;
  username: string;
  role: string;
  /** Epoch milliseconds after which the token must no longer be used. */
  expiresAt: number;
}
