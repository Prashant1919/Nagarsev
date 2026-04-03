import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="login-page">

      <!-- Background geometric accent -->
      <div class="bg-orb bg-orb-1"></div>
      <div class="bg-orb bg-orb-2"></div>

      <div class="login-card">

        <!-- Header -->
        <div class="login-header">
          <div class="login-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          </div>
          <h1>Nagarsevak Dashboard</h1>
          <p>Pune Municipal Corporation — Private Access</p>
        </div>

        <!-- Form -->
        <form class="login-form" (ngSubmit)="handleLogin()">
          @if (auth.error()) {
            <div class="error-banner">
              <span>⚠</span>
              <span>{{ auth.error() }}</span>
            </div>
          }

          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              class="form-control"
              [class.error]="touched() && !usernameModel.trim()"
              type="text"
              placeholder="Enter your username"
              [(ngModel)]="usernameModel"
              name="username"
              autocomplete="username"
              autofocus
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-field">
              <input
                id="password"
                class="form-control"
                [class.error]="touched() && !passwordModel"
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Enter your password"
                [(ngModel)]="passwordModel"
                name="password"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="pw-toggle"
                (click)="showPassword.update(v => !v)"
                [title]="showPassword() ? 'Hide password' : 'Show password'"
              >
                @if (showPassword()) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary login-btn"
            [disabled]="auth.loading() || !usernameModel.trim() || !passwordModel"
          >
            @if (auth.loading()) {
              <span class="spinner"></span>
              <span>Authenticating…</span>
            } @else {
              <span>Sign In</span>
            }
          </button>
        </form>

        <p class="login-footer">
          🔒 Private — Authorised access only
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }

    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }
    .bg-orb-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%);
      top: -200px; right: -100px;
    }
    .bg-orb-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
      bottom: -150px; left: -100px;
    }

    .login-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow-lg);
      position: relative;
      z-index: 1;
      animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .login-logo {
      width: 60px; height: 60px;
      margin: 0 auto 16px;
      background: var(--accent-dim);
      border: 1px solid var(--accent-border);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      svg { width: 28px; height: 28px; color: var(--accent); }
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    p { font-size: 13px; color: var(--text-muted); }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: var(--radius-sm);
      color: var(--status-error);
      font-size: 13px;
    }

    .password-field {
      position: relative;
      .form-control { padding-right: 44px; }
    }

    .pw-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      padding: 4px;
      display: flex;
      align-items: center;
      transition: color var(--transition);
      svg { width: 16px; height: 16px; }
      &:hover { color: var(--text-secondary); }
    }

    .login-btn {
      width: 100%;
      justify-content: center;
      padding: 12px;
      font-size: 15px;
      margin-top: 4px;
    }

    .login-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 12px;
      color: var(--text-muted);
    }
  `],
})
export class LoginComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  usernameModel = '';
  passwordModel = '';

  readonly showPassword = signal(false);
  readonly touched = signal(false);

  async handleLogin(): Promise<void> {
    this.touched.set(true);
    this.auth.clearError();

    if (!this.usernameModel.trim() || !this.passwordModel) return;

    const ok = await this.auth.login({
      username: this.usernameModel.trim(),
      password: this.passwordModel,
    });

    if (ok) {
      this.router.navigate(['/dashboard']);
    }
  }
}