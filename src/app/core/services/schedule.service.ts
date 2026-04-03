import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment'; 
import type { ScheduleEvent, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBase}/schedule`;

  // ── State ──────────────────────────────────
  private readonly _events = signal<ScheduleEvent[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedDate = signal(this.todayISO());

  // ── Selectors ──────────────────────────────
  readonly events = this._events.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedDate = this._selectedDate.asReadonly();

  readonly eventsForSelectedDate = computed(() => {
    const date = this._selectedDate();
    return this._events()
      .filter((e) => e.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  });

  readonly upcomingEvents = computed(() => {
    const today = this.todayISO();
    return this._events()
      .filter((e) => e.date >= today && e.status === 'scheduled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 5);
  });

  readonly todayCount = computed(
    () => this._events().filter((e) => e.date === this.todayISO()).length
  );

  // ── Actions ────────────────────────────────
  async fetchAll(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<ScheduleEvent[]>>(this.base)
      );
      if (res.success && res.data) {
        this._events.set(res.data);
      }
    } catch (err: any) {
      this._error.set(err?.error?.error ?? 'Failed to load schedule');
    } finally {
      this._loading.set(false);
    }
  }

  async create(payload: Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleEvent | null> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<ScheduleEvent>>(this.base, payload)
      );
      if (res.success && res.data) {
        this._events.update((evs) => [...evs, res.data!]);
        return res.data;
      }
      return null;
    } catch (err: any) {
      this._error.set(err?.error?.error ?? 'Failed to create event');
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async update(id: string, payload: Partial<ScheduleEvent>): Promise<boolean> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.put<ApiResponse<ScheduleEvent>>(`${this.base}/${id}`, payload)
      );
      if (res.success && res.data) {
        this._events.update((evs) =>
          evs.map((e) => (e.id === id ? { ...e, ...res.data! } : e))
        );
        return true;
      }
      return false;
    } catch (err: any) {
      this._error.set(err?.error?.error ?? 'Failed to update event');
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
        this._events.update((evs) => evs.filter((e) => e.id !== id));
        return true;
      }
      return false;
    } catch (err: any) {
      this._error.set(err?.error?.error ?? 'Failed to delete event');
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  setSelectedDate(date: string): void {
    this._selectedDate.set(date);
  }

  clearError(): void {
    this._error.set(null);
  }

  private todayISO(): string {
    return new Date().toISOString().split('T')[0];
  }
}
