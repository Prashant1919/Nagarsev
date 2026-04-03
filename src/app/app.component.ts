import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './core/services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <router-outlet />

    <!-- Global Toast Notifications -->
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast-{{ toast.type }}" (click)="toastService.dismiss(toast.id)">
          <span class="toast-icon">
            @switch (toast.type) {
              @case ('success') { ✓ }
              @case ('error')   { ✕ }
              @default          { ℹ }
            }
          </span>
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .toast-icon {
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .toast-success .toast-icon { background: rgba(34,197,94,0.2); color: #22C55E; }
    .toast-error   .toast-icon { background: rgba(239,68,68,0.2);  color: #EF4444; }
    .toast-info    .toast-icon { background: rgba(59,130,246,0.2); color: #3B82F6; }
  `],
})
export class AppComponent {
  readonly toastService = inject(ToastService);
}
