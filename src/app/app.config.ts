import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatInputModule} from '@angular/material/input';

import { routes } from './app.routes';
import { AuthGuard } from './app-auth-guard.js';
import {  MatButtonModule } from '@angular/material/button';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), 
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatSnackBar,
    MatInputModule,
    AuthGuard,
    MatButtonModule
  ]
  
};
