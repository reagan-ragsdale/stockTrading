import { Routes } from '@angular/router';
import { HomeScreenComponent } from './home-screen/home-screen.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './app-auth-guard';
import { KeyScreenComponent } from './key-screen/key-screen.component';
import { KeyGuard } from './app-key-guard';
import { AuthScreenComponent } from './auth-screen/auth-screen.component';
import { TestScreenComponent } from './test-screen/test-screen.component';
import { TradeHistoryDetailComponent } from './trade-history-detail/trade-history-detail.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ServerTradeScreenComponent } from './server-trade-screen/server-trade-screen.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full'},
    {path: 'home', title: 'home', component: HomeScreenComponent},
    {path: 'testEnv', title: 'TestEnv', component: TestScreenComponent},
    {path: 'login', component: AuthComponent},
    {path: 'keys', component: KeyScreenComponent},
    {path: 'auth', component: AuthScreenComponent},
    {path: 'orderHistory', component: TradeHistoryDetailComponent},
    {path: 'dashboard', component: DashboardComponent},
    {path: 'serverTradeList', component: ServerTradeScreenComponent}
];
