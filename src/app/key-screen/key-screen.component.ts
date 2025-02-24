import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { remult } from 'remult';
import { Rhkeys, rhRepo } from '../../shared/tasks/rhkeys.js';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-key-screen',
  standalone: true,
  imports: [CommonModule,MatProgressSpinnerModule, FormsModule, MatCardModule, MatToolbarModule, MatFormFieldModule, MatSnackBarModule, MatInputModule, MatButtonModule],
  templateUrl: './key-screen.component.html',
  styleUrl: './key-screen.component.css'
})
export class KeyScreenComponent implements OnInit, OnDestroy{
  constructor(private router: Router, private _snackBar: MatSnackBar, private cachedData: CachedData) {
    }
  remult = remult
  keys: PublicPRivateKeys = {
    publicKey: '',
    privateKey: ''
  }
  appKey: string = ''
  appSecret: string = ''
  unsubscribe = () => { }
  incomingTokensFromDb: any = []
  isLoadingTokens: boolean = false;

  async allowOAuth(){
  await AuthController.insertKeyPairs(this.appKey, this.appSecret)
   window.open(`https://api.schwabapi.com/v1/oauth/authorize?response_type=code&client_id=${this.appKey}&scope=readonly&redirect_uri=https://stocktrading.up.railway.app/auth`,
      "_blank"
    )?.focus()
    this.isLoadingTokens = true;
   //add livequery to look for the new update to the token table
    this.unsubscribe = rhRepo
      .liveQuery({
        where: Rhkeys.getTokenUpdates({  })
      })
      .subscribe(info => this.checkData(info.items))
    
  }
  checkData(change: any){
    this.incomingTokensFromDb.push(change[0].accessToken)
    if(this.incomingTokensFromDb.length == 2){
      if(this.incomingTokensFromDb[0] != this.incomingTokensFromDb[1]){
        this.cachedData.changeAccessToken(this.incomingTokensFromDb[1])
        this.router.navigate(['/home'])
      }
    }
  }




  newId: string = ''
  isKeysGenerated: boolean = false;
  async ngOnInit(){
    this.isKeysGenerated = await AuthController.checkKeyGeneration()
    let user = remult.initUser()
    if(this.isKeysGenerated){
      let userKeys = await AuthController.getKeyPairs()
      window.open(`https://api.schwabapi.com/v1/oauth/authorize?response_type=code&client_id=${userKeys.appKey}&scope=readonly&redirect_uri=https://stocktrading.up.railway.app/auth`,
        "_blank"
      )?.focus()
      this.isLoadingTokens = true;
      this.unsubscribe = rhRepo
      .liveQuery({
        where: Rhkeys.getTokenUpdates({  })
      })
      .subscribe(info => this.checkData(info.items))
    }
  }
  ngOnDestroy() {
    this.unsubscribe()
  }
  
}
