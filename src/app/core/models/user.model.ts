export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  createdAt: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultView: 'list' | 'board' | 'calendar';
  };
}

/** Safe public shape — passwordHash is stripped before this leaves the service. */
export type PublicUser = Omit<User, 'passwordHash'>;
