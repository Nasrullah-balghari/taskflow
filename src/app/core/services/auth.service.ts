import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User, PublicUser } from '../models/user.model';
import { AuthResult, LoginRequest, SignupRequest } from '../models/auth.model';
import { StorageService } from './storage.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(StorageService);
  private readonly router  = inject(Router);
  private readonly toast   = inject(ToastService);

  private readonly _currentUser = signal<PublicUser | null>(null);

  /** Read-only signal — components subscribe to this, never write to it. */
  readonly currentUser    = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());

  constructor() {
    // Restore session across page refreshes.
    const saved = this.storage.get<PublicUser | null>('currentUser', null);
    if (saved) this._currentUser.set(saved);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Validates the request, hashes the password, creates a User in LocalStorage,
   * and auto-logs the new user in.
   */
  async signup(request: SignupRequest): Promise<AuthResult> {
    // Field presence
    if (!request.name.trim() || !request.email.trim() ||
        !request.password     || !request.confirmPassword) {
      return { success: false, error: 'All fields are required.' };
    }

    // Email format
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(request.email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    // Password strength
    if (request.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Confirm match
    if (request.password !== request.confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    // Duplicate email
    const users    = this.storage.get<User[]>('users', []);
    const emailKey = request.email.toLowerCase();
    if (users.some(u => u.email === emailKey)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    // Persist new user
    const passwordHash = await this.hashPassword(request.password);
    const newUser: User = {
      id:           crypto.randomUUID(),
      name:         request.name.trim(),
      email:        emailKey,
      passwordHash,
      createdAt:    new Date().toISOString(),
      preferences:  { theme: 'system', defaultView: 'list' },
    };

    users.push(newUser);
    this.storage.set('users', users);

    // Auto-login
    const publicUser = this.getPublicUser(newUser);
    this.setSession(publicUser);

    this.toast.success('Welcome to TaskFlow!', {
      message: `Account created for ${emailKey}`,
    });

    return { success: true, user: publicUser };
  }

  /**
   * Looks up the user by email, compares the SHA-256 hash, and sets the session.
   * Never reveals whether the email or the password was wrong.
   */
  async login(request: LoginRequest): Promise<AuthResult> {
    if (!request.email.trim() || !request.password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const users    = this.storage.get<User[]>('users', []);
    const emailKey = request.email.toLowerCase();
    const user     = users.find(u => u.email === emailKey);

    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const hash = await this.hashPassword(request.password);
    if (hash !== user.passwordHash) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const publicUser = this.getPublicUser(user);
    this.setSession(publicUser);

    this.toast.success('Welcome back!', {
      message: publicUser.name,
      duration: 2500,
    });

    return { success: true, user: publicUser };
  }

  /** Clears the session signal, removes from LocalStorage, and redirects to /login. */
  logout(): void {
    this._currentUser.set(null);
    this.storage.remove('currentUser');
    this.toast.info('Logged out');
    this.router.navigate(['/login']);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private setSession(user: PublicUser): void {
    this._currentUser.set(user);
    this.storage.set('currentUser', user);
  }

  /** SHA-256 via the built-in Web Crypto API — returns a lowercase hex string. */
  private async hashPassword(password: string): Promise<string> {
    const bytes  = new TextEncoder().encode(password);
    const buffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /** Strips `passwordHash` so it never reaches component code. */
  private getPublicUser(user: User): PublicUser {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }
}
