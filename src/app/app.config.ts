import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';

const AppTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#EEEDFF',
      100: '#D5D3FF',
      200: '#ABABFF',
      300: '#8480FF',
      400: '#7870FF',
      500: '#6C63FF',
      600: '#5A52DC',
      700: '#4840B8',
      800: '#362F95',
      900: '#241E71',
      950: '#18134E',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: AppTheme } }),
  ]
};
