import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ── Zoneless Angular 21 ─────────────────
    provideZonelessChangeDetection(),

    // ── Router ──────────────────────────────
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions()
    ),

    // ── HTTP with fetch API ──────────────────
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),

    // ── Animations ──────────────────────────
    provideAnimationsAsync(),
  ],
};
