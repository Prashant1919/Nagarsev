import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { type LoginCredentials, type AuthUser } from '../models';

const TOKEN_KEY = 'ns_auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // ── State (signals) ────────────────────────
  private readonly _user = signal<AuthUser | null>(this.loadStoredUser());
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // ── Public selectors ───────────────────────
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => {
    const u = this._user();
    return u !== null && u.expiresAt > Date.now();
  });
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // ── Actions ────────────────────────────────
  async login(credentials: LoginCredentials): Promise<boolean> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await this.http
        .post<{ token: string; expiresAt: number }>(
          `${environment.apiBase}/auth`,
          credentials
        )
        .toPromise();

      if (!res) throw new Error('No response from server');

      const user: AuthUser = {
        username: credentials.username,
        token: res.token,
        expiresAt: res.expiresAt,
      };

      sessionStorage.setItem(TOKEN_KEY, JSON.stringify(user));
      this._user.set(user);
      return true;
    } catch (err: any) {
      const msg =
        err?.error?.error ?? err?.message ?? 'Authentication failed';
      this._error.set(msg);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._user()?.token ?? null;
  }

  clearError(): void {
    this._error.set(null);
  }

  // ── Internals ──────────────────────────────
  private loadStoredUser(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const user: AuthUser = JSON.parse(raw);
      // Auto-expire check
      if (user.expiresAt < Date.now()) {
        sessionStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }
}
