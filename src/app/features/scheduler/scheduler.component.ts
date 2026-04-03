import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScheduleService } from '../../core/services/schedule.service';
import { ToastService } from '../../core/services/toast.service';
import type { ScheduleEvent, EventStatus, EventPriority } from '../../core/models';

type FormMode = 'create' | 'edit';

interface EventForm {
  date: string;
  time: string;
  title: string;
  description: string;
  location: string;
  status: EventStatus;
  priority: EventPriority;
  attendees: string;
}

const emptyForm = (): EventForm => ({
  date: new Date().toISOString().split('T')[0],
  time: '09:00',
  title: '',
  description: '',
  location: '',
  status: 'scheduled',
  priority: 'medium',
  attendees: '',
});

@Component({
  selector: 'app-scheduler',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="scheduler page-enter">

      <!-- ── Page Header ──────────────────────── -->
      <div class="page-header">
        <div>
          <h1>Daily Schedule</h1>
          <p class="subtitle">Manage meetings, visits, and events</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          + Add Event
        </button>
      </div>

      <!-- ── Calendar Strip ───────────────────── -->
      <div class="calendar-strip-wrapper">
        <button class="strip-nav" (click)="shiftWeek(-1)">‹</button>
        <div class="calendar-strip">
          @for (day of weekDays(); track day.iso) {
            <button
              class="day-cell"
              [class.active]="day.iso === scheduleService.selectedDate()"
              [class.today]="day.isToday"
              (click)="scheduleService.setSelectedDate(day.iso)"
            >
              <span class="day-name">{{ day.name }}</span>
              <span class="day-num">{{ day.num }}</span>
              @if (day.hasEvents) { <span class="day-dot"></span> }
            </button>
          }
        </div>
        <button class="strip-nav" (click)="shiftWeek(1)">›</button>
      </div>

      <!-- ── Selected Date Header ─────────────── -->
      <div class="date-heading">
        <h2>{{ selectedDateFormatted() }}</h2>
        <span class="badge badge-neutral">
          {{ scheduleService.eventsForSelectedDate().length }} event(s)
        </span>
      </div>

      <!-- ── Events for selected date ─────────── -->
      @if (scheduleService.loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Loading schedule…</span>
        </div>
      } @else if (scheduleService.eventsForSelectedDate().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📅</span>
          <h3>No events on this day</h3>
          <p>Click "Add Event" to schedule something</p>
        </div>
      } @else {
        <div class="timeline">
          @for (event of scheduleService.eventsForSelectedDate(); track event.id) {
            <div class="timeline-item" [class]="'priority-' + event.priority">
              <div class="timeline-time">
                <span>{{ event.time }}</span>
              </div>
              <div class="timeline-dot" [class]="'dot-' + event.status"></div>
              <div class="timeline-card card">
                <div class="tc-header">
                  <div>
                    <h3 class="tc-title">{{ event.title }}</h3>
                    @if (event.location) {
                      <p class="tc-meta">📍 {{ event.location }}</p>
                    }
                  </div>
                  <div class="tc-actions">
                    <span class="badge badge-{{ statusBadge(event.status) }}">{{ event.status }}</span>
                    <span class="badge badge-{{ priorityBadge(event.priority) }}">{{ event.priority }}</span>
                    <button class="btn btn-ghost btn-icon" title="Edit" (click)="openEdit(event)">✎</button>
                    <button class="btn btn-danger btn-icon" title="Delete" (click)="confirmDelete(event)">✕</button>
                  </div>
                </div>
                @if (event.description) {
                  <p class="tc-desc">{{ event.description }}</p>
                }
                @if (event.attendees) {
                  <p class="tc-meta">👥 {{ event.attendees }}</p>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- ── Event Modal ─────────────────────── -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">

            <div class="modal-header">
              <h2>{{ formMode() === 'create' ? 'Add New Event' : 'Edit Event' }}</h2>
              <button class="btn btn-ghost btn-icon" (click)="closeModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-grid">

                <div class="form-group grid-2-col">
                  <div class="form-group">
                    <label>Date *</label>
                    <input type="date" class="form-control" [(ngModel)]="form.date" name="date" />
                  </div>
                  <div class="form-group">
                    <label>Time *</label>
                    <input type="time" class="form-control" [(ngModel)]="form.time" name="time" />
                  </div>
                </div>

                <div class="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="form.title"
                    name="title"
                    placeholder="e.g. Ward Committee Meeting"
                  />
                </div>

                <div class="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="form.location"
                    name="location"
                    placeholder="e.g. PMC Main Office, Shivajinagar"
                  />
                </div>

                <div class="form-group">
                  <label>Description / Notes</label>
                  <textarea class="form-control" [(ngModel)]="form.description" name="description"
                    placeholder="Agenda, talking points, reminders…"></textarea>
                </div>

                <div class="form-group grid-2-col">
                  <div class="form-group">
                    <label>Priority</label>
                    <select class="form-control" [(ngModel)]="form.priority" name="priority">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Status</label>
                    <select class="form-control" [(ngModel)]="form.status" name="status">
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="rescheduled">Rescheduled</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label>Attendees</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="form.attendees"
                    name="attendees"
                    placeholder="Comma-separated names"
                  />
                </div>

              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-ghost" (click)="closeModal()">Cancel</button>
              <button
                class="btn btn-primary"
                (click)="saveEvent()"
                [disabled]="scheduleService.loading() || !form.title || !form.date"
              >
                @if (scheduleService.loading()) {
                  <span class="spinner"></span>
                }
                {{ formMode() === 'create' ? 'Save Event' : 'Update Event' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ── Delete confirm modal ───────────── -->
      @if (deleteTarget()) {
        <div class="modal-backdrop" (click)="cancelDelete()">
          <div class="modal" style="max-width:380px" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Delete Event?</h2>
              <button class="btn btn-ghost btn-icon" (click)="cancelDelete()">✕</button>
            </div>
            <div class="modal-body">
              <p style="color: var(--text-secondary)">
                Are you sure you want to delete <strong>"{{ deleteTarget()?.title }}"</strong>?
                This cannot be undone.
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" (click)="cancelDelete()">Cancel</button>
              <button class="btn btn-danger" (click)="executeDelete()" [disabled]="scheduleService.loading()">
                Delete Event
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .scheduler { max-width: 860px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    }
    h1 { font-size: 26px; }
    .subtitle { color: var(--text-muted); font-size: 13px; margin-top: 4px; }

    /* Calendar strip */
    .calendar-strip-wrapper {
      display: flex; align-items: center; gap: 8px;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 12px 16px;
      margin-bottom: 24px;
    }
    .strip-nav {
      background: var(--bg-elevated); border: 1px solid var(--border);
      color: var(--text-secondary); width: 32px; height: 32px;
      border-radius: 8px; cursor: pointer; font-size: 18px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: all var(--transition);
      &:hover { color: var(--accent); border-color: var(--accent-border); }
    }
    .calendar-strip {
      display: flex; gap: 6px; overflow-x: auto; flex: 1;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }
    .day-cell {
      display: flex; flex-direction: column; align-items: center; gap: 3px;
      padding: 8px 10px; border-radius: 10px; cursor: pointer;
      border: 1px solid transparent; background: transparent;
      color: var(--text-secondary); min-width: 52px;
      transition: all var(--transition);
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
      &.today .day-num { color: var(--accent); font-weight: 700; }
      &.active {
        background: var(--accent-dim); border-color: var(--accent-border);
        color: var(--accent-light);
      }
    }
    .day-name { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    .day-num  { font-family: var(--font-display); font-size: 16px; font-weight: 600; }
    .day-dot  { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }

    /* Date heading */
    .date-heading {
      display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
      h2 { font-size: 18px; }
    }

    .loading-state {
      display: flex; align-items: center; gap: 10px;
      color: var(--text-muted); font-size: 14px; padding: 40px;
    }

    /* Timeline */
    .timeline { display: flex; flex-direction: column; gap: 0; position: relative; }
    .timeline-item {
      display: grid;
      grid-template-columns: 60px 20px 1fr;
      gap: 12px;
      align-items: flex-start;
      position: relative;
      padding-bottom: 16px;

      &:last-child .timeline-card::before { display: none; }
    }

    .timeline-time {
      text-align: right; padding-top: 16px;
      font-size: 13px; font-weight: 600; font-family: var(--font-display);
      color: var(--text-muted); white-space: nowrap;
    }

    .timeline-dot {
      width: 12px; height: 12px; border-radius: 50%;
      margin-top: 20px; flex-shrink: 0; position: relative;
      &::after {
        content: ''; position: absolute; left: 5px; top: 12px;
        width: 2px; height: calc(100% + 16px);
        background: var(--border);
      }
      &.dot-scheduled  { background: var(--status-info); box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
      &.dot-completed  { background: var(--status-success); }
      &.dot-cancelled  { background: var(--text-muted); }
      &.dot-rescheduled{ background: var(--status-warning); }
    }

    .timeline-card {
      padding: 14px 16px;
      &.card { border-radius: var(--radius-md); }
    }
    .priority-high .timeline-card   { border-left: 3px solid var(--status-error); }
    .priority-medium .timeline-card { border-left: 3px solid var(--status-warning); }
    .priority-low .timeline-card    { border-left: 3px solid var(--status-success); }

    .tc-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 8px; flex-wrap: wrap;
    }
    .tc-title { font-size: 15px; font-weight: 600; }
    .tc-meta  { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
    .tc-desc  { font-size: 13px; color: var(--text-secondary); margin-top: 8px; }
    .tc-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

    /* Form grid in modal */
    .form-grid { display: flex; flex-direction: column; gap: 16px; }
    .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  `],
})
export class SchedulerComponent implements OnInit {
  readonly scheduleService = inject(ScheduleService);
  private readonly toast = inject(ToastService);

  readonly showModal = signal(false);
  readonly formMode = signal<FormMode>('create');
  readonly deleteTarget = signal<ScheduleEvent | null>(null);

  form: EventForm = emptyForm();
  private editingId = signal<string | null>(null);

  private weekOffset = signal(0);

  readonly weekDays = computed(() => {
    const offset = this.weekOffset();
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + offset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const isToday = iso === new Date().toISOString().split('T')[0];
      const hasEvents = this.scheduleService.events().some((e) => e.date === iso);
      return {
        iso,
        name: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        num: d.getDate(),
        isToday,
        hasEvents,
      };
    });
  });

  readonly selectedDateFormatted = computed(() => {
    const d = new Date(this.scheduleService.selectedDate() + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  });

  ngOnInit(): void {
    this.scheduleService.fetchAll();
  }

  shiftWeek(dir: number): void {
    this.weekOffset.update((v) => v + dir);
  }

  openCreate(): void {
    this.form = emptyForm();
    this.form.date = this.scheduleService.selectedDate();
    this.formMode.set('create');
    this.editingId.set(null);
    this.showModal.set(true);
  }

  openEdit(event: ScheduleEvent): void {
    this.form = {
      date: event.date,
      time: event.time,
      title: event.title,
      description: event.description,
      location: event.location,
      status: event.status,
      priority: event.priority,
      attendees: event.attendees,
    };
    this.formMode.set('edit');
    this.editingId.set(event.id);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  async saveEvent(): Promise<void> {
    if (!this.form.title || !this.form.date) return;

    if (this.formMode() === 'create') {
      const created = await this.scheduleService.create(this.form);
      if (created) {
        this.toast.success('Event added to schedule');
        this.closeModal();
      } else {
        this.toast.error(this.scheduleService.error() ?? 'Failed to save');
      }
    } else {
      const id = this.editingId();
      if (!id) return;
      const ok = await this.scheduleService.update(id, this.form);
      if (ok) {
        this.toast.success('Event updated');
        this.closeModal();
      } else {
        this.toast.error(this.scheduleService.error() ?? 'Failed to update');
      }
    }
  }

  confirmDelete(event: ScheduleEvent): void {
    this.deleteTarget.set(event);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  async executeDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    const ok = await this.scheduleService.delete(target.id);
    if (ok) {
      this.toast.success('Event deleted');
      this.deleteTarget.set(null);
    } else {
      this.toast.error('Failed to delete event');
    }
  }

  statusBadge(s: string): string {
    return {
      scheduled: 'info', completed: 'success',
      cancelled: 'neutral', rescheduled: 'warning',
    }[s] ?? 'neutral';
  }

  priorityBadge(p: string): string {
    return { high: 'error', medium: 'warning', low: 'success' }[p] ?? 'neutral';
  }
}
