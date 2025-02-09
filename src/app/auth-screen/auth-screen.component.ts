import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CachedData } from '../services/cachedDataService';
import { Router } from '@angular/router';
import { oauthCall } from '../../server/oauth-server';
import { OAuthContoller } from '../../shared/controllers/OAuthController.js';
import { remult } from 'remult';

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
  remult = remult

  

  async getTokens() {
    try{
      let returnCall = await OAuthContoller.sendOauthCall(this.code)
      this.sharedCache.changeAccessToken(returnCall[0])
      this.sharedCache.changeRefreshToken(returnCall[1])
      window.close();
    }
    catch(error: any){
      
    }
    
    
    


  }

  async getUrl(){
    console.log('here in get url')
    this.code = this.url.slice(this.url.indexOf('code=') + 5, this.url.indexOf('@') + 1)
    this.sharedCache.changeCurrentCode(this.code)
    await this.getTokens()
  }

  async ngOnInit() {
    let user = await remult.initUser()
    console.log('user info below')
    console.log(remult.authenticated())
    this.url = location.href
    this.getUrl()
  }

}
