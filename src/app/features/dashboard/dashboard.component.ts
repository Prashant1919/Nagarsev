import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';

import { RouterLink, } from '@angular/router';
import { ScheduleService } from '../../core/services/schedule.service';
import { RecordsService } from '../../core/services/records.service';
import { AuthService } from '../../core/auth/auth.service';
import { TitleCasePipe } from '@angular/common';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink,TitleCasePipe],
  template: `
    <div class="dashboard page-enter">

      <!-- ── Header ──────────────────────────── -->
      <div class="page-header">
        <div>
          <p class="greeting">{{ greeting() }},</p>
          <h1>{{ auth.user()?.username | titlecase }}</h1>
          <p class="date-line">{{ todayFormatted() }} · Ward in Charge</p>
        </div>
        <div class="header-actions">
          <a routerLink="/scheduler" class="btn btn-primary">
            + New Event
          </a>
          <a routerLink="/records" class="btn btn-ghost">
            + New Record
          </a>
        </div>
      </div>

      @if (scheduleService.loading() || recordsService.loading()) {
        <div class="loading-row">
          <div class="spinner"></div>
          <span>Loading data…</span>
        </div>
      }

      <!-- ── Stat Cards ───────────────────────── -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon stat-orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-label">Today's Events</span>
            <span class="stat-value">{{ scheduleService.todayCount() }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17,3 17,8 12,8"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-label">Total Records</span>
            <span class="stat-value">{{ recordsService.stats().total }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-yellow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-label">Open Issues</span>
            <span class="stat-value">{{ recordsService.stats().open }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-label">Urgent Issues</span>
            <span class="stat-value">{{ recordsService.stats().urgent }}</span>
          </div>
        </div>
      </div>

      <!-- ── Two-col layout ───────────────────── -->
      <div class="dashboard-grid">

        <!-- Upcoming Events -->
        <section class="card">
          <div class="section-header">
            <h2>Upcoming Events</h2>
            <a routerLink="/scheduler" class="btn btn-ghost btn-sm">View All</a>
          </div>

          @if (scheduleService.upcomingEvents().length === 0) {
            <div class="empty-state">
              <span class="empty-icon">📅</span>
              <h3>No upcoming events</h3>
              <p>Your schedule is clear</p>
            </div>
          } @else {
            <div class="event-list">
              @for (event of scheduleService.upcomingEvents(); track event.id) {
                <div class="event-item" [class]="'priority-' + event.priority">
                  <div class="event-time-block">
                    <span class="event-date">{{ formatDate(event.date) }}</span>
                    <span class="event-time">{{ event.time }}</span>
                  </div>
                  <div class="event-details">
                    <p class="event-title">{{ event.title }}</p>
                    @if (event.location) {
                      <p class="event-loc">📍 {{ event.location }}</p>
                    }
                  </div>
                  <span class="badge badge-{{ priorityBadge(event.priority) }}">
                    {{ event.priority }}
                  </span>
                </div>
              }
            </div>
          }
        </section>

        <!-- Record Stats + Recent -->
        <section class="card">
          <div class="section-header">
            <h2>Issue Status</h2>
            <a routerLink="/records" class="btn btn-ghost btn-sm">View All</a>
          </div>

          <!-- Progress bars -->
          <div class="status-bars">
            <div class="status-bar-item">
              <div class="status-bar-label">
                <span>Open</span>
                <span class="text-muted">{{ recordsService.stats().open }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill fill-yellow"
                  [style.width]="getPercent(recordsService.stats().open) + '%'"></div>
              </div>
            </div>
            <div class="status-bar-item">
              <div class="status-bar-label">
                <span>In Progress</span>
                <span class="text-muted">{{ recordsService.stats().inProgress }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill fill-blue"
                  [style.width]="getPercent(recordsService.stats().inProgress) + '%'"></div>
              </div>
            </div>
            <div class="status-bar-item">
              <div class="status-bar-label">
                <span>Resolved</span>
                <span class="text-muted">{{ recordsService.stats().resolved }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill fill-green"
                  [style.width]="getPercent(recordsService.stats().resolved) + '%'"></div>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Category quick links -->
          <div class="quick-categories">
            <p class="text-sm text-muted" style="margin-bottom: 10px;">Quick filter by category</p>
            <div class="category-chips">
              @for (cat of categories; track cat.value) {
                <a routerLink="/records" class="category-chip">
                  <span>{{ cat.icon }}</span>
                  <span>{{ cat.label }}</span>
                </a>
              }
            </div>
          </div>
        </section>

      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1200px; }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .greeting { font-size: 14px; color: var(--text-muted); margin-bottom: 4px; }
    h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .date-line { font-size: 13px; color: var(--text-muted); }
    .header-actions { display: flex; gap: 10px; align-items: center; }

    .loading-row {
      display: flex; align-items: center; gap: 10px;
      color: var(--text-muted); font-size: 13px; margin-bottom: 16px;
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
      @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: border-color var(--transition);
      &:hover { border-color: rgba(148,163,192,0.25); }
    }

    .stat-icon {
      width: 44px; height: 44px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      svg { width: 20px; height: 20px; }
    }
    .stat-orange { background: rgba(249,115,22,0.12); color: var(--accent); }
    .stat-blue   { background: rgba(59,130,246,0.12);  color: var(--status-info); }
    .stat-yellow { background: rgba(234,179,8,0.12);   color: var(--status-warning); }
    .stat-red    { background: rgba(239,68,68,0.12);   color: var(--status-error); }

    .stat-body { display: flex; flex-direction: column; gap: 2px; }
    .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
    .stat-value { font-family: var(--font-display); font-size: 24px; font-weight: 700; line-height: 1; }

    /* Dashboard grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
      h2 { font-size: 16px; }
    }

    /* Event list */
    .event-list { display: flex; flex-direction: column; gap: 10px; }
    .event-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--bg-elevated);
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--border);
      transition: border-color var(--transition);

      &.priority-high   { border-left-color: var(--status-error); }
      &.priority-medium { border-left-color: var(--status-warning); }
      &.priority-low    { border-left-color: var(--status-success); }
    }

    .event-time-block {
      display: flex; flex-direction: column; align-items: center;
      min-width: 52px; text-align: center;
    }
    .event-date { font-size: 11px; color: var(--text-muted); }
    .event-time { font-size: 14px; font-weight: 600; font-family: var(--font-display); color: var(--accent); }
    .event-details { flex: 1; min-width: 0; }
    .event-title { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .event-loc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

    /* Progress bars */
    .status-bars { display: flex; flex-direction: column; gap: 14px; }
    .status-bar-item {}
    .status-bar-label {
      display: flex; justify-content: space-between;
      font-size: 13px; margin-bottom: 6px;
      span:first-child { color: var(--text-secondary); }
    }
    .progress-track {
      height: 6px;
      background: var(--bg-base);
      border-radius: 99px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 99px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .fill-yellow { background: var(--status-warning); }
    .fill-blue   { background: var(--status-info); }
    .fill-green  { background: var(--status-success); }

    /* Category chips */
    .category-chips {
      display: flex; flex-wrap: wrap; gap: 8px;
    }
    .category-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 10px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 99px;
      font-size: 12px;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all var(--transition);
      &:hover { border-color: var(--accent-border); color: var(--accent-light); background: var(--accent-dim); }
    }
  `],
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly scheduleService = inject(ScheduleService);
  readonly recordsService = inject(RecordsService);

  readonly categories = [
    { value: 'road_repair',   icon: '🛣️',  label: 'Roads' },
    { value: 'water_supply',  icon: '💧',  label: 'Water' },
    { value: 'drainage',      icon: '🚿',  label: 'Drainage' },
    { value: 'garbage',       icon: '🗑️',  label: 'Garbage' },
    { value: 'street_light',  icon: '💡',  label: 'Lights' },
    { value: 'document',      icon: '📄',  label: 'Document' },
    { value: 'grievance',     icon: '📢',  label: 'Grievance' },
  ];

  readonly greeting = signal(this.getGreeting());

  ngOnInit(): void {
    this.scheduleService.fetchAll();
    this.recordsService.fetchAll();
  }

  readonly todayFormatted = computed(() =>
    new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  );

  formatDate(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (iso === today.toISOString().split('T')[0]) return 'Today';
    if (iso === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  priorityBadge(p: string): string {
    return { high: 'error', medium: 'warning', low: 'success' }[p] ?? 'neutral';
  }

  getPercent(count: number): number {
    const total = this.recordsService.stats().total;
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  private getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }
}
