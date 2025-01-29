import { Component,NgZone  } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { remult } from "remult"
import { AuthComponent } from './auth/auth.component';
import { FormControl } from '@angular/forms';


@Component({
  selector: 'app-root',
  imports: [ AuthComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(zone: NgZone) {
    remult.apiClient.wrapMessageHandling = handler => zone.run(() => handler())
  }
  title = 'stockTrading';
}
