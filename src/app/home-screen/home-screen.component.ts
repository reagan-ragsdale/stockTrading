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
  accountNum: any = 0
  userPreferenceData: any = {}

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
    const url = 'https://api.schwabapi.com/trader/v1/userPreference';
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };
    try{
      const response = await fetch(url, options);
      const result = await response.json();
      console.log(result)
      const body = result[0]
      this.userPreferenceData = body
    }
    catch(error: any){
      console.log(error.message)
    }
  }
  schwabWebsocket: any
  startWebsocket(){
    this.schwabWebsocket = new WebSocket(this.userPreferenceData.streamerInfo.streamerSocketUrl)
    const aaplDataMsg = {
      "requests" : [
        {
          "service": "LEVELONE_EQUITIES",
          "requestid": "1",
          "command": "SUBS",
          "SchwabClientCustomerId": this.userPreferenceData.streamerInfo.schwabClientCustomerId,
          "SchwabClientCorrelId": this.userPreferenceData.streamerInfo.schwabClientCorrelId,
          "parameters": {
           "keys": "AAPL",
           "fields": "0,1,2,3,4,5,6,7,8,9,10"
          }
        }
      ]
    }
    this.schwabWebsocket.send(JSON.stringify(aaplDataMsg))
    this.schwabWebsocket.onmessage = (event: any) => {
      console.log(event)
    }
      
  }

  

  async ngOnInit(){
    await this.getUserData()
    this.startWebsocket()
    this.userSimFinData = await SimFinance.getSimFinData()
  }

}
