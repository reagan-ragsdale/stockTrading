import { APP_INITIALIZER, ApplicationConfig, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatInputModule} from '@angular/material/input';

import { routes } from './app.routes';
import { AuthGuard } from './app-auth-guard.js';
import {  MatButtonModule } from '@angular/material/button';
import { AuthController } from '../shared/controllers/AuthController.js';
import { remult } from 'remult';
import { api } from '../server/api';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core'

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), 
    { provide: provideAppInitializer(initApp()), useFactory: initApp, multi: true },
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatSnackBar,
    MatInputModule,
    AuthGuard,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule 
  ]
  
};

export function initApp() {
  const loadCurrentUserBeforeAppStarts = async () => {
    //remult.user = await AuthController.currentUser()
    let userThing = remult.initUser()
    
  }
  return loadCurrentUserBeforeAppStarts
}
