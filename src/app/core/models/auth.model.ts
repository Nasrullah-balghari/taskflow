import { PublicUser } from './user.model';

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: PublicUser;
}
