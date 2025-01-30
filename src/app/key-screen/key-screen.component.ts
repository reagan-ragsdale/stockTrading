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

@Component({
  selector: 'app-key-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatToolbarModule, MatFormFieldModule, MatSnackBarModule, MatInputModule, MatButtonModule],
  templateUrl: './key-screen.component.html',
  styleUrl: './key-screen.component.css'
})
export class KeyScreenComponent implements OnInit{
  constructor(private router: Router, private _snackBar: MatSnackBar) {
    }
  keys: PublicPRivateKeys = {
    publicKey: '',
    privateKey: ''
  }
  insertApiKey: string = ''

  async onSubmit(){
    try{
      await AuthController.insertKeyPairs(this.keys.publicKey, this.keys.privateKey, this.insertApiKey)

      const isKeysGenerated = await AuthController.checkKeyGeneration()
      if(isKeysGenerated){
        this.router.navigate(['/home'])
      }
      
    }
    catch(error: any){
      this._snackBar.open(error.message, 'close',{duration: 8000})
    }
    
  }


  ngOnInit(){
    this.keys = KeyPairService.generatePublicPrivateKeyPair()
  }

}
