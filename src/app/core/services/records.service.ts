import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import type { CitizenRecord, ApiResponse, RecordStatus, RecordCategory } from '../models';

@Injectable({ providedIn: 'root' })
export class RecordsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBase}/records`;

  // ── State ──────────────────────────────────
  private readonly _records = signal<CitizenRecord[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _search = signal('');
  private readonly _filterStatus = signal<RecordStatus | 'all'>('all');
  private readonly _filterCategory = signal<RecordCategory | 'all'>('all');

  // ── Selectors ──────────────────────────────
  readonly records = this._records.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly search = this._search.asReadonly();
  readonly filterStatus = this._filterStatus.asReadonly();
  readonly filterCategory = this._filterCategory.asReadonly();

  readonly filteredRecords = computed(() => {
    let items = this._records();
    const q = this._search().toLowerCase();
    const status = this._filterStatus();
    const category = this._filterCategory();

    if (q) {
      items = items.filter(
        (r) =>
          r.citizenName.toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q) ||
          r.contact.includes(q) ||
          r.area.toLowerCase().includes(q)
      );
    }
    if (status !== 'all') {
      items = items.filter((r) => r.status === status);
    }
    if (category !== 'all') {
      items = items.filter((r) => r.category === category);
    }

    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  readonly stats = computed(() => {
    const all = this._records();
    return {
      total: all.length,
      open: all.filter((r) => r.status === 'open').length,
      inProgress: all.filter((r) => r.status === 'in-progress').length,
      resolved: all.filter((r) => r.status === 'resolved').length,
      urgent: all.filter((r) => r.priority === 'urgent').length,
    };
  });

  // ── Actions ────────────────────────────────
  async fetchAll(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<CitizenRecord[]>>(this.base)
      );
      if (res.success && res.data) {
        this._records.set(res.data);
      }
    } catch (err: any) {
      this._error.set(err?.error?.error ?? 'Failed to load records');
    } finally {
      this._loading.set(false);
    }
  }

  async create(payload: Omit<CitizenRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CitizenRecord | null> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<CitizenRecord>>(this.base, payload)
      );
      if (res.success && res.data) {
        this._records.update((recs) => [res.data!, ...recs]);
        return res.data;
      }
      return null;
    } catch (err: any) {
      this._error.set(err?.error?.error ?? 'Failed to create record');
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async update(id: string, payload: Partial<CitizenRecord>): Promise<boolean> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.put<ApiResponse<CitizenRecord>>(`${this.base}/${id}`, payload)
      );
      if (res.success && res.data) {
        this._records.update((recs) =>
          recs.map((r) => (r.id === id ? { ...r, ...res.data! } : r))
        );
        return true;
      }
      return false;
    } catch (err: any) {
      this._error.set(err?.error?.error ?? 'Failed to update record');
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  async delete(id: string): Promise<boolean> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.delete<ApiResponse<void>>(`${this.base}/${id}`)
      );
      if (res.success) {
        this._records.update((recs) => recs.filter((r) => r.id !== id));
        return true;
      }
      return false;
    } catch (err: any) {
      this._error.set(err?.error?.error ?? 'Failed to delete record');
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  setSearch(q: string): void { this._search.set(q); }
  setFilterStatus(s: RecordStatus | 'all'): void { this._filterStatus.set(s); }
  setFilterCategory(c: RecordCategory | 'all'): void { this._filterCategory.set(c); }
  clearError(): void { this._error.set(null); }
}
