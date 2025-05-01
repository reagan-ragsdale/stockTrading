import { Component,NgZone} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { remult } from "remult";
import { CommonModule } from '@angular/common';
import { FormControl } from '@angular/forms';
import { AuthController } from '../shared/controllers/AuthController.js';
import { MatButtonModule } from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import { SimFInance, simFinRepo } from '../shared/tasks/simFinance.js';
import { SchwabController } from '../shared/controllers/SchwabController.js';
import { dbTokenRepo } from '../shared/tasks/dbTokens.js';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ CommonModule, RouterOutlet,MatIconModule,MatMenuModule,MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent{
  constructor(zone: NgZone, private router: Router) {
    remult.apiClient.wrapMessageHandling = handler => zone.run(() => handler())
  }
  title = 'stockTrading';
  remult = remult;
  async logout(){
    await AuthController.signOut()
    remult.user = undefined;
    this.router.navigate([`/login`])
  }
  navToHome(){
    this.router.navigate([`/home`])
  }
  navToOrderHistory(){
    this.router.navigate([`/orderHistory`])
  }
  navToDashboard(){
    this.router.navigate([`/dashboard`])
  }
  navToServerAlgos(){
    this.router.navigate([`/serverTradeList`])
  }
  sharedFinance: SimFInance | undefined = undefined
  schwabFinance: any
  async ngOnInit(){
    remult.initUser()
    let tokens = await AuthController.getTokenUserByRemult()
    this.sharedFinance = await simFinRepo.findFirst({userId: 'Shared'})
    let accountNum = await SchwabController.getAccountsNumberCall(tokens?.accessToken!)
    this.schwabFinance = await SchwabController.getAccountInfoCall(accountNum[0].hashValue, tokens?.accessToken!)
    console.log(this.schwabFinance)
  }
}
