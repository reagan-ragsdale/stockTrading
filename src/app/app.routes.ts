import { Routes } from '@angular/router';
import { HomeScreenComponent } from './home-screen/home-screen.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './app-auth-guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full'},
    {path: 'home', title: 'home', component: HomeScreenComponent, canActivate: [AuthGuard]},
    {path: 'login', component: AuthComponent}
];
