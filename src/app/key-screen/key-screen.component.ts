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

  allowOAuth(){
    this.cachedData.changeCurrentAppKey(this.appKey)
    this.cachedData.changeCurrentAppSecret(this.appSecret)
   window.open(`https://api.schwabapi.com/v1/oauth/authorize?response_type=code&client_id=${this.appKey}&scope=readonly&redirect_uri=https://stocktrading.up.railway.app`,
      "_self"
    )
    
  }


  newId: string = ''
  ngOnInit(){
  }
  
}
