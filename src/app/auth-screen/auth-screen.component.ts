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
    try{
      let returnCall = await OAuthContoller.sendOauthCall(this.code)
      this.sharedCache.changeAccessToken(returnCall[0])
      this.sharedCache.changeRefreshToken(returnCall[1])
      this.router.navigate(['/home'])
    }
    catch(error: any){
      
    }
    
    
    


  }

  ngOnInit() {
    this.getTokens()
  }

}
