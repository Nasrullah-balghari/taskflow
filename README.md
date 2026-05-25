# TaskFlow

A task management web application built with Angular 19. Organize your work across multiple views — dashboard, board, calendar, and more — with a full client-side authentication system.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Angular 19 (standalone components) |
| Language | TypeScript 5.7 (strict mode) |
| State | Angular Signals (`signal`, `computed`) |
| Forms | Angular Reactive Forms |
| Routing | Angular Router with functional guards |
| Storage | Browser LocalStorage |
| Styling | Custom SCSS (no Tailwind, no UI library) |
| Icons | Inline SVG |
| Crypto | Web Crypto API (`crypto.subtle.digest`) |

---

## Features

- **Authentication** — Signup, login, logout with SHA-256 hashed passwords stored in LocalStorage
- **Route protection** — `authGuard` blocks unauthenticated access; `publicOnlyGuard` redirects logged-in users away from auth pages
- **Deep linking** — Attempting to visit a protected URL while logged out redirects to `/login?returnUrl=<path>` and returns the user there after login
- **Reactive user state** — All UI (topbar avatar, sidebar user card, dashboard greeting) reacts to `AuthService.currentUser` signal — no manual refresh needed
- **Session persistence** — User session survives page refresh via LocalStorage
- **Lazy-loaded auth pages** — Login and Signup compile to separate chunks and are never loaded for authenticated users
- **Responsive sidebar** — Collapses to icon-only mode on desktop; slides in as an overlay on mobile

---

## Project Structure

```
src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts          # Protects all app routes
│   │   └── public-only.guard.ts   # Blocks logged-in users from /login, /signup
│   ├── models/
│   │   ├── user.model.ts          # User, PublicUser interfaces
│   │   └── auth.model.ts          # SignupRequest, LoginRequest, AuthResult
│   └── services/
│       ├── auth.service.ts        # Signup, login, logout, session management
│       └── storage.service.ts     # Typed LocalStorage wrapper (taskflow: prefix)
│
├── features/
│   └── auth/
│       ├── login/                 # Lazy-loaded login page
│       └── signup/                # Lazy-loaded signup page
│
├── dashboard/                     # Dashboard with greeting + stat cards
├── all-tasks/
├── board-view/
├── calendar/
├── today/
├── upcoming/
├── work/
├── personal/
│
├── app.component.ts               # Root shell — sidebar + topbar layout
├── app.routes.ts                  # All route definitions
└── app.config.ts                  # App bootstrap config
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm start
# → http://localhost:4200

# Production build
npm run build
```

No environment variables or backend required. Everything runs in the browser.

---

## Routing

```
/                   → redirects to /dashboard (auth required)
/dashboard          → Dashboard (auth required)
/today              → Today view (auth required)
/upcoming           → Upcoming view (auth required)
/all-tasks          → All Tasks (auth required)
/board-view         → Board view (auth required)
/calendar           → Calendar (auth required)
/work               → Work category (auth required)
/personal           → Personal category (auth required)
/login              → Login page (redirects to /dashboard if already logged in)
/signup             → Signup page (redirects to /dashboard if already logged in)
```

All protected routes are grouped under an empty-path parent that applies `authGuard` once:

```typescript
{
  path: '',
  canActivate: [authGuard],
  children: [ ...all app routes ]
}
```

---

## Auth System

### How it works

1. **Signup** — validates fields, hashes password with SHA-256 (Web Crypto API), saves `User` to `taskflow:users` in LocalStorage, auto-logs in by writing `PublicUser` to `taskflow:currentUser`
2. **Login** — looks up user by email, re-hashes the submitted password, compares hashes, sets session on match
3. **Session restore** — `AuthService` constructor reads `taskflow:currentUser` on app boot; the signal is populated before any guard runs
4. **Logout** — clears the signal, removes `taskflow:currentUser`, navigates to `/login`

### Security notes

- Passwords are never stored in plaintext — only the SHA-256 hex digest
- `PublicUser` (`Omit<User, 'passwordHash'>`) is what the signal exposes — the hash never leaves `AuthService`
- Error messages never distinguish between "email not found" and "wrong password" to prevent user enumeration

### LocalStorage keys

| Key | Content |
|---|---|
| `taskflow:users` | `User[]` — all registered accounts |
| `taskflow:currentUser` | `PublicUser` — active session |

---

## Core Services

### `AuthService`

```typescript
currentUser: Signal<PublicUser | null>   // read-only, use in templates
isAuthenticated: Signal<boolean>         // computed from currentUser

signup(request: SignupRequest): Promise<AuthResult>
login(request: LoginRequest): Promise<AuthResult>
logout(): void
```

### `StorageService`

Typed wrapper around `localStorage` with a `taskflow:` prefix on all keys.

```typescript
get<T>(key: string, defaultValue: T): T
set<T>(key: string, value: T): void
remove(key: string): void
clear(): void   // only removes taskflow: prefixed keys
```

---

## Key Patterns Used

**Functional guards returning `UrlTree`**
```typescript
export const authGuard: CanActivateFn = (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
```

**Computed signals for derived UI state**
```typescript
readonly firstName = computed(() =>
  this.authService.currentUser()?.name.split(' ')[0] ?? 'Guest'
);
```

**Auth pages overlaying the app shell**

Auth pages use `position: fixed; inset: 0; z-index: 200` so they render on top of the sidebar/topbar shell without needing a separate layout component or route nesting.

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Dev server at `localhost:4200` |
| `npm run build` | Production build to `dist/taskflow/` |
| `npm run watch` | Dev build with file watching |
| `npm test` | Unit tests via Karma + Jasmine |
