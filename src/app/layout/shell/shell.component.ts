import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell" [class.nav-collapsed]="collapsed()">

      <!-- ── Sidebar ───────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-top">
          <!-- Logo / Brand -->
          <div class="brand">
            <div class="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
            </div>
            @if (!collapsed()) {
              <div class="brand-text">
                <span class="brand-title">Nagarsevak</span>
                <span class="brand-sub">PMC Dashboard</span>
              </div>
            }
          </div>

          <!-- Nav links -->
          <nav class="nav">
            <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </span>
              @if (!collapsed()) { <span>Dashboard</span> }
            </a>

            <a class="nav-link" routerLink="/scheduler" routerLinkActive="active">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              @if (!collapsed()) { <span>Daily Schedule</span> }
            </a>

            <a class="nav-link" routerLink="/records" routerLinkActive="active">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17,3 17,8 12,8"/>
                  <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
                </svg>
              </span>
              @if (!collapsed()) { <span>Citizen Records</span> }
            </a>
          </nav>
        </div>

        <!-- Sidebar Footer -->
        <div class="sidebar-bottom">
          <button class="nav-link logout-btn" (click)="auth.logout()">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            @if (!collapsed()) { <span>Logout</span> }
          </button>
        </div>
      </aside>

      <!-- ── Collapse toggle ───────────────── -->
      <button class="collapse-btn" (click)="collapsed.update(v => !v)" [title]="collapsed() ? 'Expand' : 'Collapse'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [style.transform]="collapsed() ? 'rotate(180deg)' : ''">
          <polyline points="15,18 9,12 15,6"/>
        </svg>
      </button>

      <!-- ── Main Content ───────────────────── -->
      <main class="main-content">
        <div class="page-enter">
          <router-outlet />
        </div>
      </main>

    </div>
  `,
  styles: [`
    .shell {
      display: grid;
      grid-template-columns: 220px 1fr;
      grid-template-rows: 1fr;
      min-height: 100vh;
      position: relative;

      &.nav-collapsed {
        grid-template-columns: 64px 1fr;
        .nav-link { justify-content: center; }
      }
    }

    .sidebar {
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: hidden;
      transition: width var(--transition-slow);
      z-index: 100;
      grid-row: 1;
    }

    .sidebar-top { display: flex; flex-direction: column; gap: 0; flex: 1; }
    .sidebar-bottom { padding: 12px 10px; border-top: 1px solid var(--border); }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 8px;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      background: var(--accent-dim);
      border: 1px solid var(--accent-border);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      svg { width: 18px; height: 18px; color: var(--accent); }
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .brand-title {
      font-family: var(--font-display);
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
    }
    .brand-sub {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    nav.nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 10px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      transition: all var(--transition);
      cursor: pointer;
      border: none;
      background: transparent;
      width: 100%;
      text-decoration: none;
      white-space: nowrap;

      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }

      &.active {
        background: var(--accent-dim);
        color: var(--accent-light);
        border: 1px solid var(--accent-border);
        .nav-icon svg { color: var(--accent); }
      }

      &.logout-btn {
        color: var(--text-muted);
        &:hover { color: var(--status-error); background: rgba(239,68,68,0.08); }
      }
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      svg { width: 16px; height: 16px; }
    }

    .collapse-btn {
      position: fixed;
      left: calc(220px - 12px);
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 200;
      transition: left var(--transition-slow);
      svg { width: 12px; height: 12px; color: var(--text-muted); transition: transform var(--transition); }
      &:hover { border-color: var(--accent-border); svg { color: var(--accent); } }

      .nav-collapsed & { left: calc(64px - 12px); }
    }

    .main-content {
      background: var(--bg-base);
      overflow-y: auto;
      min-height: 100vh;
      padding: 32px;

      @media (max-width: 768px) { padding: 16px; }
    }
  `],
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly collapsed = signal(false);
}
