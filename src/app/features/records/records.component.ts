import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecordsService } from '../../core/services/records.service';
import { ToastService } from '../../core/services/toast.service';
import type {
  CitizenRecord,
  RecordStatus,
  RecordCategory,
  RecordPriority,
} from '../../core/models';

type FormMode = 'create' | 'edit' | 'view';

interface RecordForm {
  citizenName: string;
  contact: string;
  ward: string;
  area: string;
  category: RecordCategory;
  subject: string;
  description: string;
  status: RecordStatus;
  priority: RecordPriority;
  followUpDate: string;
  internalNotes: string;
  resolvedNote: string;
}

const emptyForm = (): RecordForm => ({
  citizenName: '',
  contact: '',
  ward: '',
  area: '',
  category: 'other',
  subject: '',
  description: '',
  status: 'open',
  priority: 'medium',
  followUpDate: '',
  internalNotes: '',
  resolvedNote: '',
});

@Component({
  selector: 'app-records',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="records page-enter">

      <!-- ── Header ──────────────────────────── -->
      <div class="page-header">
        <div>
          <h1>Citizen Records</h1>
          <p class="subtitle">Log and track PMC issues, queries, and grievances</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">+ New Record</button>
      </div>

      <!-- ── Filter Bar ───────────────────────── -->
      <div class="filter-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            class="form-control search-input"
            type="text"
            placeholder="Search by name, subject, contact, area…"
            [value]="recordsService.search()"
            (input)="recordsService.setSearch($any($event.target).value)"
          />
        </div>

        <select
          class="form-control filter-select"
          [value]="recordsService.filterStatus()"
          (change)="recordsService.setFilterStatus($any($event.target).value)"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          class="form-control filter-select"
          [value]="recordsService.filterCategory()"
          (change)="recordsService.setFilterCategory($any($event.target).value)"
        >
          <option value="all">All Categories</option>
          @for (cat of categories; track cat.value) {
            <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
          }
        </select>

        <span class="result-count">
          {{ recordsService.filteredRecords().length }} records
        </span>
      </div>

      <!-- ── Table ────────────────────────────── -->
      @if (recordsService.loading()) {
        <div class="loading-state"><div class="spinner"></div><span>Loading records…</span></div>
      } @else if (recordsService.filteredRecords().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📂</span>
          <h3>No records found</h3>
          <p>Try adjusting your filters or add a new record</p>
        </div>
      } @else {
        <div class="table-wrapper">
          <table class="records-table">
            <thead>
              <tr>
                <th>Citizen</th>
                <th>Subject / Category</th>
                <th>Area / Ward</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (rec of recordsService.filteredRecords(); track rec.id) {
                <tr (click)="openView(rec)" class="table-row">
                  <td>
                    <p class="citizen-name">{{ rec.citizenName }}</p>
                    <p class="citizen-contact">{{ rec.contact }}</p>
                  </td>
                  <td>
                    <p class="subject-text">{{ rec.subject }}</p>
                    <span class="badge badge-neutral cat-badge">{{ getCatLabel(rec.category) }}</span>
                  </td>
                  <td>
                    <p>{{ rec.area }}</p>
                    <p class="text-muted text-sm">Ward {{ rec.ward }}</p>
                  </td>
                  <td (click)="$event.stopPropagation()">
                    <span class="badge badge-{{ statusBadge(rec.status) }}">{{ rec.status }}</span>
                  </td>
                  <td (click)="$event.stopPropagation()">
                    <span class="badge badge-{{ priorityBadge(rec.priority) }}">{{ rec.priority }}</span>
                  </td>
                  <td>
                    <p class="text-sm">{{ formatDate(rec.createdAt) }}</p>
                  </td>
                  <td (click)="$event.stopPropagation()">
                    <div class="row-actions">
                      <button class="btn btn-ghost btn-icon" title="Edit" (click)="openEdit(rec)">✎</button>
                      <button class="btn btn-danger btn-icon" title="Delete" (click)="confirmDelete(rec)">✕</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ── Record Modal (Create / Edit / View) ── -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal modal-wide" (click)="$event.stopPropagation()">

            <div class="modal-header">
              <h2>
                @switch (formMode()) {
                  @case ('create') { New Citizen Record }
                  @case ('edit')   { Edit Record }
                  @case ('view')   { Record Details }
                }
              </h2>
              <div style="display:flex;gap:8px">
                @if (formMode() === 'view') {
                  <button class="btn btn-ghost btn-sm" (click)="switchToEdit()">Edit</button>
                }
                <button class="btn btn-ghost btn-icon" (click)="closeModal()">✕</button>
              </div>
            </div>

            <div class="modal-body">
              @if (formMode() === 'view' && viewRecord()) {
                <!-- View mode -->
                <div class="view-grid">
                  <div class="view-field"><span class="vf-label">Citizen Name</span><span>{{ viewRecord()!.citizenName }}</span></div>
                  <div class="view-field"><span class="vf-label">Contact</span><span>{{ viewRecord()!.contact }}</span></div>
                  <div class="view-field"><span class="vf-label">Ward / Area</span><span>Ward {{ viewRecord()!.ward }} — {{ viewRecord()!.area }}</span></div>
                  <div class="view-field"><span class="vf-label">Category</span><span>{{ getCatLabel(viewRecord()!.category) }}</span></div>
                  <div class="view-field full"><span class="vf-label">Subject</span><span>{{ viewRecord()!.subject }}</span></div>
                  <div class="view-field full"><span class="vf-label">Description</span><span>{{ viewRecord()!.description || '—' }}</span></div>
                  <div class="view-field"><span class="vf-label">Status</span><span class="badge badge-{{ statusBadge(viewRecord()!.status) }}">{{ viewRecord()!.status }}</span></div>
                  <div class="view-field"><span class="vf-label">Priority</span><span class="badge badge-{{ priorityBadge(viewRecord()!.priority) }}">{{ viewRecord()!.priority }}</span></div>
                  @if (viewRecord()!.followUpDate) {
                    <div class="view-field"><span class="vf-label">Follow-up Date</span><span>{{ viewRecord()!.followUpDate }}</span></div>
                  }
                  @if (viewRecord()!.internalNotes) {
                    <div class="view-field full"><span class="vf-label">Internal Notes</span><span>{{ viewRecord()!.internalNotes }}</span></div>
                  }
                  @if (viewRecord()!.resolvedNote) {
                    <div class="view-field full"><span class="vf-label">Resolution Note</span><span>{{ viewRecord()!.resolvedNote }}</span></div>
                  }
                  <div class="view-field"><span class="vf-label">Created</span><span>{{ formatDate(viewRecord()!.createdAt) }}</span></div>
                  <div class="view-field"><span class="vf-label">Updated</span><span>{{ formatDate(viewRecord()!.updatedAt) }}</span></div>
                </div>
              } @else {
                <!-- Create / Edit form -->
                <div class="form-sections">

                  <div class="form-section">
                    <h3 class="section-title">Citizen Details</h3>
                    <div class="form-row">
                      <div class="form-group">
                        <label>Full Name *</label>
                        <input class="form-control" type="text" [(ngModel)]="form.citizenName" placeholder="Ramesh Kumar" />
                      </div>
                      <div class="form-group">
                        <label>Contact Number</label>
                        <input class="form-control" type="tel" [(ngModel)]="form.contact" placeholder="9876543210" />
                      </div>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <label>Ward No.</label>
                        <input class="form-control" type="text" [(ngModel)]="form.ward" placeholder="e.g. 3D" />
                      </div>
                      <div class="form-group">
                        <label>Area / Locality</label>
                        <input class="form-control" type="text" [(ngModel)]="form.area" placeholder="e.g. Aundh, Pune" />
                      </div>
                    </div>
                  </div>

                  <div class="form-section">
                    <h3 class="section-title">Issue / Query</h3>
                    <div class="form-row">
                      <div class="form-group">
                        <label>Category *</label>
                        <select class="form-control" [(ngModel)]="form.category">
                          @for (cat of categories; track cat.value) {
                            <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
                          }
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Priority *</label>
                        <select class="form-control" [(ngModel)]="form.priority">
                          <option value="urgent">🔴 Urgent</option>
                          <option value="high">🟠 High</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="low">🟢 Low</option>
                        </select>
                      </div>
                    </div>
                    <div class="form-group">
                      <label>Subject *</label>
                      <input class="form-control" type="text" [(ngModel)]="form.subject" placeholder="Brief description of the issue" />
                    </div>
                    <div class="form-group">
                      <label>Detailed Description</label>
                      <textarea class="form-control" [(ngModel)]="form.description" placeholder="Full details of the complaint or request…"></textarea>
                    </div>
                  </div>

                  <div class="form-section">
                    <h3 class="section-title">Tracking</h3>
                    <div class="form-row">
                      <div class="form-group">
                        <label>Status</label>
                        <select class="form-control" [(ngModel)]="form.status">
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Follow-up Date</label>
                        <input class="form-control" type="date" [(ngModel)]="form.followUpDate" />
                      </div>
                    </div>
                    <div class="form-group">
                      <label>Internal Notes (private)</label>
                      <textarea class="form-control" [(ngModel)]="form.internalNotes" placeholder="Private notes, action taken, contacts called…"></textarea>
                    </div>
                    @if (form.status === 'resolved' || form.status === 'closed') {
                      <div class="form-group">
                        <label>Resolution Note</label>
                        <textarea class="form-control" [(ngModel)]="form.resolvedNote" placeholder="How was this resolved?"></textarea>
                      </div>
                    }
                  </div>

                </div>
              }
            </div>

            @if (formMode() !== 'view') {
              <div class="modal-footer">
                <button class="btn btn-ghost" (click)="closeModal()">Cancel</button>
                <button
                  class="btn btn-primary"
                  (click)="saveRecord()"
                  [disabled]="recordsService.loading() || !form.citizenName || !form.subject"
                >
                  @if (recordsService.loading()) { <span class="spinner"></span> }
                  {{ formMode() === 'create' ? 'Save Record' : 'Update Record' }}
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── Delete confirm ────────────────── -->
      @if (deleteTarget()) {
        <div class="modal-backdrop" (click)="cancelDelete()">
          <div class="modal" style="max-width:380px" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Delete Record?</h2>
              <button class="btn btn-ghost btn-icon" (click)="cancelDelete()">✕</button>
            </div>
            <div class="modal-body">
              <p style="color:var(--text-secondary)">
                Delete record for <strong>"{{ deleteTarget()?.citizenName }}"</strong>? This cannot be undone.
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" (click)="cancelDelete()">Cancel</button>
              <button class="btn btn-danger" (click)="executeDelete()" [disabled]="recordsService.loading()">Delete</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .records { max-width: 1100px; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }
    h1 { font-size: 26px; }
    .subtitle { color: var(--text-muted); font-size: 13px; margin-top: 4px; }

    /* Filter bar */
    .filter-bar {
      display: flex; align-items: center; gap: 10px;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 12px 16px;
      margin-bottom: 20px; flex-wrap: wrap;
    }
    .search-box { position: relative; flex: 1; min-width: 220px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; }
    .search-input { padding-left: 34px; }
    .filter-select { max-width: 160px; }
    .result-count { font-size: 12px; color: var(--text-muted); white-space: nowrap; margin-left: auto; }

    .loading-state { display: flex; align-items: center; gap: 10px; color: var(--text-muted); padding: 40px; }

    /* Table */
    .table-wrapper { overflow-x: auto; border-radius: var(--radius-lg); border: 1px solid var(--border); }

    .records-table {
      width: 100%; border-collapse: collapse;

      thead tr { background: var(--bg-elevated); }
      th {
        padding: 12px 14px; text-align: left;
        font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
        text-transform: uppercase; color: var(--text-muted);
        border-bottom: 1px solid var(--border); white-space: nowrap;
      }

      tbody tr.table-row {
        border-bottom: 1px solid var(--border);
        transition: background var(--transition);
        cursor: pointer;
        &:last-child { border-bottom: none; }
        &:hover { background: var(--bg-hover); }
      }

      td {
        padding: 12px 14px;
        vertical-align: middle;
        font-size: 13px;
      }
    }

    .citizen-name    { font-weight: 500; font-size: 14px; }
    .citizen-contact { color: var(--text-muted); font-size: 12px; margin-top: 2px; }
    .subject-text    { font-size: 13px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cat-badge       { margin-top: 4px; font-size: 10px; }
    .row-actions     { display: flex; gap: 6px; }

    /* Modal wide */
    .modal-wide { max-width: 720px; }

    /* Form sections */
    .form-sections { display: flex; flex-direction: column; gap: 20px; }
    .form-section  { display: flex; flex-direction: column; gap: 12px; }
    .section-title {
      font-size: 13px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--text-muted);
      padding-bottom: 6px; border-bottom: 1px solid var(--border);
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    /* View mode */
    .view-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
    }
    .view-field {
      display: flex; flex-direction: column; gap: 4px;
      padding: 10px 12px; background: var(--bg-elevated); border-radius: var(--radius-sm);
      &.full { grid-column: 1 / -1; }
    }
    .vf-label {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-muted);
    }
  `],
})
export class RecordsComponent implements OnInit {
  readonly recordsService = inject(RecordsService);
  private readonly toast = inject(ToastService);

  readonly showModal = signal(false);
  readonly formMode = signal<FormMode>('create');
  readonly viewRecord = signal<CitizenRecord | null>(null);
  readonly deleteTarget = signal<CitizenRecord | null>(null);
  private editingId = signal<string | null>(null);

  form: RecordForm = emptyForm();

  readonly categories = [
    { value: 'road_repair',  icon: '🛣️',  label: 'Road Repair' },
    { value: 'water_supply', icon: '💧',  label: 'Water Supply' },
    { value: 'drainage',     icon: '🚿',  label: 'Drainage' },
    { value: 'garbage',      icon: '🗑️',  label: 'Garbage' },
    { value: 'street_light', icon: '💡',  label: 'Street Light' },
    { value: 'encroachment', icon: '🚧',  label: 'Encroachment' },
    { value: 'document',     icon: '📄',  label: 'Document' },
    { value: 'grievance',    icon: '📢',  label: 'Grievance' },
    { value: 'other',        icon: '📌',  label: 'Other' },
  ];

  ngOnInit(): void {
    this.recordsService.fetchAll();
  }

  openCreate(): void {
    this.form = emptyForm();
    this.formMode.set('create');
    this.editingId.set(null);
    this.viewRecord.set(null);
    this.showModal.set(true);
  }

  openEdit(rec: CitizenRecord): void {
    this.form = {
      citizenName: rec.citizenName, contact: rec.contact,
      ward: rec.ward, area: rec.area, category: rec.category,
      subject: rec.subject, description: rec.description,
      status: rec.status, priority: rec.priority,
      followUpDate: rec.followUpDate, internalNotes: rec.internalNotes,
      resolvedNote: rec.resolvedNote,
    };
    this.formMode.set('edit');
    this.editingId.set(rec.id);
    this.viewRecord.set(null);
    this.showModal.set(true);
  }

  openView(rec: CitizenRecord): void {
    this.viewRecord.set(rec);
    this.formMode.set('view');
    this.showModal.set(true);
  }

  switchToEdit(): void {
    const rec = this.viewRecord();
    if (rec) this.openEdit(rec);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  async saveRecord(): Promise<void> {
    if (!this.form.citizenName || !this.form.subject) return;

    if (this.formMode() === 'create') {
      const created = await this.recordsService.create(this.form);
      if (created) {
        this.toast.success('Citizen record saved');
        this.closeModal();
      } else {
        this.toast.error(this.recordsService.error() ?? 'Failed to save');
      }
    } else {
      const id = this.editingId();
      if (!id) return;
      const ok = await this.recordsService.update(id, this.form);
      if (ok) {
        this.toast.success('Record updated');
        this.closeModal();
      } else {
        this.toast.error(this.recordsService.error() ?? 'Failed to update');
      }
    }
  }

  confirmDelete(rec: CitizenRecord): void { this.deleteTarget.set(rec); }
  cancelDelete(): void { this.deleteTarget.set(null); }

  async executeDelete(): Promise<void> {
    const t = this.deleteTarget();
    if (!t) return;
    const ok = await this.recordsService.delete(t.id);
    if (ok) { this.toast.success('Record deleted'); this.deleteTarget.set(null); }
    else { this.toast.error('Failed to delete'); }
  }

  getCatLabel(val: string): string {
    return this.categories.find((c) => c.value === val)?.label ?? val;
  }

  statusBadge(s: string): string {
    return { open: 'warning', 'in-progress': 'info', resolved: 'success', closed: 'neutral' }[s] ?? 'neutral';
  }

  priorityBadge(p: string): string {
    return { urgent: 'error', high: 'error', medium: 'warning', low: 'success' }[p] ?? 'neutral';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
