import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CachedData } from '../services/cachedDataService';
import { Router } from '@angular/router';
import { oauthCall } from '../../server/oauth-server';
import { OAuthContoller } from '../../shared/controllers/OAuthController';

@Component({
  selector: 'app-auth-screen',
  imports: [MatProgressSpinnerModule],
  templateUrl: './auth-screen.component.html',
  styleUrl: './auth-screen.component.css'
})
export class AuthScreenComponent implements OnInit {
  constructor(private sharedCache: CachedData, private router: Router) { }
  code: string = ''
  url: string = ''

  

  async getTokens() {
    this.code = ''
    this.sharedCache.currentCode.subscribe(code => this.code = code!)
    let returnCall = await OAuthContoller.sendOauthCall(this.code)
    console.log(returnCall)
    
    


  }

  ngOnInit() {
    this.getTokens()
  }

}
