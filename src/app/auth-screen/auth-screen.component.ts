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
    let appKey = ''
    let appSecret = ''
    this.code = ''
    this.sharedCache.currentAppKey.subscribe(key => appKey = key!)
    this.sharedCache.currentAppSecret.subscribe(secret => appSecret = secret!)
    this.sharedCache.currentCode.subscribe(code => this.code = code!)
    console.log(this.code)
    //appKey = btoa(appKey)
    //appSecret = btoa(appSecret)
    let returnCall = OAuthContoller.sendOauthCall(appKey, appSecret, this.code)
    console.log(returnCall)
    
    


  }

  ngOnInit() {
    this.getTokens()
  }

}
