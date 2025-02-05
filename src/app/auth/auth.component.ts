import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { remult } from 'remult'
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'
import { AuthController } from '../../shared/controllers/AuthController'
import { MatCardModule } from '@angular/material/card'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { MatInputModule } from '@angular/material/input';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { NewUserService } from '../services/newUserService.js';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CachedData } from '../services/cachedDataService';


@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule,MatProgressSpinnerModule, MatCardModule, MatToolbarModule, MatFormFieldModule, MatSnackBarModule, MatInputModule, MatButtonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent implements OnInit {
  constructor(private router: Router, private _snackBar: MatSnackBar, private sharedCache: CachedData) {
  }
  signInUsername = ''
  signInPassword = ''
  signInConfirmPassword = ''
  isLoginMode: boolean = true;
  remult = remult

  signUpMessage = `Don't have an account? Sign Up`
  loginMessage = `Already have an account? Login`



  async onSubmit() {

    if (this.isLoginMode) {
      try {

        remult.user = await AuthController.logIn(this.signInUsername, this.signInPassword)
        if (remult.authenticated()) {
          this.router.navigate(['/keys'])
        }
      }
      catch (error: any) {
        this._snackBar.open(error.message, 'close',{duration: 8000})
      }

    }
    else {
      try {
        remult.user = await AuthController.signUp(this.signInUsername, this.signInPassword, this.signInConfirmPassword)
        await NewUserService.createNewUserData();
        if (remult.authenticated()) {
          this.router.navigate(['/keys'])
        }
      } catch (error: any) {
        this._snackBar.open(error.message, 'close',{duration: 8000})
      }
      
    }
    








  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode
  }

  code: string = ''
  url: string = ''
  getUrl(){
    console.log('here in get url')
    this.code = this.url.slice(this.url.indexOf('code=') + 5, this.url.indexOf('@') + 1)
    this.sharedCache.changeCurrentCode(this.code)
    this.getTokens()
  }

  async getTokens(){
    let appKey = ''
    let appSecret = ''
    this.sharedCache.currentAppKey.subscribe(key => appKey = key!)
    this.sharedCache.currentAppSecret.subscribe(secret => appSecret = secret!)
    appKey = btoa(appKey)
    appSecret = btoa(appSecret)
    const url = 'https://api.schwabapi.com/v1/oauth/token';
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${appKey}:${appSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        'grant_type': 'authorization_code', 'code': this.code, 'redirect_uri': 'https://stocktrading.up.railway.app/auth'
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

  async ngOnInit() {
    let user = await remult.initUser()
    console.log(user)
    if(user){
      console.log('here in authenticated')
      this.url = location.href
      this.getUrl()
    }
  }
}