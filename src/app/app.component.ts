import { Component,NgZone} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { remult } from "remult";
import { CommonModule } from '@angular/common';
import { FormControl } from '@angular/forms';
import { AuthController } from '../shared/controllers/AuthController.js';
import { MatButtonModule } from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';


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
  navToOrderHistory(){
    this.router.navigate([`/orderHistory`])
  }

  ngOnInit(){
    remult.initUser()
  }
}
