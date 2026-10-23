import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { AuthResponse, LoginRequest, Session } from './auth.models';

const STORAGE_KEY = 'dbp.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(this.restoreSession());
  private expiryTimer?: ReturnType<typeof setTimeout>;

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly username = computed(() => this.session()?.username ?? null);
  readonly role = computed(() => this.session()?.role ?? null);

  constructor() {
    const current = this.session();
    if (current) {
      this.scheduleExpiry(current.expiresAt);
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap((response) => {
        const session: Session = {
          token: response.token,
          username: response.username,
          role: response.role,
          expiresAt: Date.now() + response.expiresIn * 1000,
        };
        this.session.set(session);
        this.persist(session);
        this.scheduleExpiry(session.expiresAt);
      }),
    );
  }

  logout(): void {
    clearTimeout(this.expiryTimer);
    this.session.set(null);
    this.persist(null);
    this.router.navigate(['/login']);
  }

  /** Returns the token only while it is still valid. */
  getToken(): string | null {
    const current = this.session();
    if (!current) {
      return null;
    }
    if (Date.now() >= current.expiresAt) {
      this.logout();
      return null;
    }
    return current.token;
  }

  private scheduleExpiry(expiresAt: number): void {
    clearTimeout(this.expiryTimer);
    this.expiryTimer = setTimeout(() => this.logout(), Math.max(expiresAt - Date.now(), 0));
  }

  // sessionStorage (not localStorage): the token is dropped when the tab is closed
  // and is not shared across tabs.
  private persist(session: Session | null): void {
    try {
      if (session) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // storage unavailable (private mode, blocked): the session stays in memory only
    }
  }

  private restoreSession(): Session | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const session = JSON.parse(raw) as Session;
      if (typeof session.token !== 'string' || !(session.expiresAt > Date.now())) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }
}
