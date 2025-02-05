import { Component, inject, OnInit } from '@angular/core';
import { SimFInance } from '../../shared/tasks/simFinance';
import { SimFinance } from '../../shared/controllers/SimFinance';
import { CommonModule } from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { AddFundsComponent } from './add-funds/add-funds.component';
import { CachedData } from '../services/cachedDataService';
@Component({
  selector: 'app-home-screen',
  imports: [CommonModule,MatIconModule,MatButtonModule],
  templateUrl: './home-screen.component.html',
  styleUrl: './home-screen.component.css'
})
export class HomeScreenComponent implements OnInit{
  constructor(private sharedCache: CachedData){

  }
  readonly dialog = inject(MatDialog);
  accountNum: any 

  userSimFinData: SimFInance | null = null
  userData: any = []

  canShowAddFunds: boolean = true;

  showAddFunds(){
    const dialogRef = this.dialog.open(AddFundsComponent, {
      width: '300px',
      enterAnimationDuration: 0,
      exitAnimationDuration: 0
    });
    dialogRef.afterClosed().subscribe(async result => {
      this.userSimFinData = await SimFinance.getSimFinData()
    });
  }

  async getUserData() {
    let accessToken = ''
    this.sharedCache.currentAccessToken.subscribe(token => accessToken = token!)
    const url = 'https://api.schwabapi.com/trader/v1/accounts/accountNumbers';
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };


    try{
      const response = await fetch(url, options);
      const result = await response.json();
      this.accountNum = result['accountNumber']
    }
    catch(error: any){
      console.log(error.message)
    }
    


  }

  

  async ngOnInit(){
    await this.getUserData()
    this.userSimFinData = await SimFinance.getSimFinData()
  }

}
