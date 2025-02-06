import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CachedData } from '../services/cachedDataService';
import { Router } from '@angular/router';

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
    //appKey = btoa(appKey)
    //appSecret = btoa(appSecret)
    let credentials: any = `${appKey}:${appSecret}`
    credentials = btoa(credentials)
    const url = 'https://api.schwabapi.com/v1/oauth/token';
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        'grant_type': 'authorization_code', 'code': this.code, 'redirect_uri': 'https://stocktrading.up.railway.app'
      }
    };


    try{
      const response = await fetch(url, options);
      const result = await response.json();
      let refreshToken = result['refresh_token']
      let accessToken = result['access_token']
      this.sharedCache.changeAccessToken(accessToken)
      this.router.navigate(['/home'])
    }
    catch(error: any){
      console.log(error.message)
    }
    


  }

  ngOnInit() {
    this.getTokens()
  }

}
