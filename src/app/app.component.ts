import { Component,NgZone  } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { remult } from "remult"
import { Router } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthController } from '../shared/controllers/AuthController.js';
import { MatButtonModule } from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ CommonModule, RouterOutlet, MatButtonModule, MatMenuModule,MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
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

  ngOnInit(){
    remult.initUser()
  }
}
