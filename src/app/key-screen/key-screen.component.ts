import { Component, OnInit } from '@angular/core';
import { KeyPairService } from '../services/keyPairService.js';
import { PublicPRivateKeys } from '../Dtos/publicPrivateKeys.js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthController } from '../../shared/controllers/AuthController.js';
import { Router } from '@angular/router';
import { CachedData } from '../services/cachedDataService.js';

@Component({
  selector: 'app-key-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatToolbarModule, MatFormFieldModule, MatSnackBarModule, MatInputModule, MatButtonModule],
  templateUrl: './key-screen.component.html',
  styleUrl: './key-screen.component.css'
})
export class KeyScreenComponent implements OnInit{
  constructor(private router: Router, private _snackBar: MatSnackBar, private cachedData: CachedData) {
    }
  keys: PublicPRivateKeys = {
    publicKey: '',
    privateKey: ''
  }
  appKey: string = ''
  appSecret: string = ''

  async allowOAuth(){
  await AuthController.insertKeyPairs(this.appKey, this.appSecret)
   window.open(`https://api.schwabapi.com/v1/oauth/authorize?response_type=code&client_id=${this.appKey}&scope=readonly&redirect_uri=https://stocktrading.up.railway.app/auth`,
      "_blank"
    )?.focus()
   // this.waitForKeyPairs()
   //add livequery to look for the new update to the token table
    
  }

  isToken: boolean = false
  waitForKeyPairs(){
    let interval = setInterval(this.checkToken,1000)
    if(this.isToken == true){
      clearInterval(interval)
      this.router.navigate(['/home'])
    }
  }

  checkToken(){
    let token = null
    this.cachedData.currentAccessToken.subscribe(accessToken => console.log(accessToken))
    if(token != null){
      this.isToken = true
    }
  }


  newId: string = ''
  isKeysGenerated: boolean = false;
  async ngOnInit(){
    this.isKeysGenerated = await AuthController.checkKeyGeneration()
    if(this.isKeysGenerated){
      let userKeys = await AuthController.getKeyPairs()
      window.open(`https://api.schwabapi.com/v1/oauth/authorize?response_type=code&client_id=${userKeys.appKey}&scope=readonly&redirect_uri=https://stocktrading.up.railway.app/auth`,
        "_blank"
      )?.focus()
      this.waitForKeyPairs()
    }
  }
  
}
