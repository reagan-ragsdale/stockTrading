import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CachedData } from '../services/cachedDataService';
import { Router } from '@angular/router';
import { oauthCall } from '../../server/oauth-server';
import { AuthController } from '../../shared/controllers/AuthController.js';
import { remult } from 'remult';
import { OAuthContoller } from '../../shared/controllers/OAuthController.js';

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
      await OAuthContoller.sendOauthCall(this.code)
      //await AuthController.updateTokens(returnCall)
      window.close();
    }
    catch(error: any){
      
    }
    
    
    


  }

  async getUrl(){
    this.code = this.url.slice(this.url.indexOf('code=') + 5, this.url.indexOf('@') + 1)
    this.sharedCache.changeCurrentCode(this.code)
    await this.getTokens()
  }

  async ngOnInit() {
    let user = await remult.initUser()
    
    this.url = location.href
    this.getUrl()
  }

}
