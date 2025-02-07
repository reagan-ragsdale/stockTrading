import { Component, inject, OnInit } from '@angular/core';
import { SimFInance } from '../../shared/tasks/simFinance';
import { SimFinance } from '../../shared/controllers/SimFinance';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
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
import { remult } from 'remult';
import { Chart, InteractionModeFunction, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
@Component({
  selector: 'app-home-screen',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './home-screen.component.html',
  styleUrl: './home-screen.component.css'
})
export class HomeScreenComponent implements OnInit {
  constructor(private sharedCache: CachedData) {

  }
  remult = remult
  readonly dialog = inject(MatDialog);
  accountNum: any = 0
  userPreferenceData: any = {}

  userSimFinData: SimFInance | null = null
  userData: any = []

  canShowAddFunds: boolean = true;

  showAddFunds() {
    const dialogRef = this.dialog.open(AddFundsComponent, {
      width: '300px',
      enterAnimationDuration: 0,
      exitAnimationDuration: 0
    });
    dialogRef.afterClosed().subscribe(async result => {
      this.userSimFinData = await SimFinance.getSimFinData()
    });
  }
  accessToken = ''
  async getUserData() {
    this.sharedCache.currentAccessToken.subscribe(token => this.accessToken = token!)
    const url = 'https://api.schwabapi.com/trader/v1/userPreference';
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    };
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      this.userPreferenceData = result
    }
    catch (error: any) {
      console.log(error.message)
    }
  }
  schwabWebsocket: WebSocket | null = null
  hasBeenSent: boolean = false
  startWebsocket() {
    this.schwabWebsocket = new WebSocket(this.userPreferenceData.streamerInfo[0].streamerSocketUrl)
    const loginMsg = {
      "requests": [
        {
          "service": "ADMIN",
          "requestid": "0",
          "command": "LOGIN",
          "SchwabClientCustomerId": this.userPreferenceData.streamerInfo[0].schwabClientCustomerId,
          "SchwabClientCorrelId": this.userPreferenceData.streamerInfo[0].schwabClientCorrelId,
          "parameters": {
            "Authorization": this.accessToken,
            "SchwabClientChannel": this.userPreferenceData.streamerInfo[0].schwabClientChannel,
            "SchwabClientFunctionId": this.userPreferenceData.streamerInfo[0].schwabClientFunctionId
          }
        }
      ]
    }
    const aaplDataMsg = {
      "requests": [
        {
          "service": "LEVELONE_EQUITIES",
          "requestid": "1",
          "command": "SUBS",
          "SchwabClientCustomerId": this.userPreferenceData.streamerInfo[0].schwabClientCustomerId,
          "SchwabClientCorrelId": this.userPreferenceData.streamerInfo[0].schwabClientCorrelId,
          "parameters": {
            "keys": "AAPL",
            "fields": "0,1,2,3,4,5,6,7,8,9,10"
          }
        }
      ]
    }
    this.schwabWebsocket.onopen = () => {
      this.schwabWebsocket!.send(JSON.stringify(loginMsg))
    }
    let count = 0
    this.schwabWebsocket.onmessage = (event: any) => {
      console.log(JSON.parse(event.data))
      
      let data = JSON.parse(event.data)
      
      if (Object.hasOwn(data, 'response')) {
        if(data.response[0].content.code == 0 && this.hasBeenSent == false){
          this.schwabWebsocket!.send(JSON.stringify(aaplDataMsg)) 
          console.log('send aapl')
          this.hasBeenSent = true
        }
      }
      if(Object.hasOwn(data, 'data') && this.hasBeenSent == true){
        if(Object.hasOwn(data.data[0].content[0], '1')){
          this.refreshData(data)
        }
        
      }
      /* 
      if (count == 0) {
        this.schwabWebsocket.send(JSON.stringify(aaplDataMsg))
      }
      count++ */
    }

  }

  chartData: any = {
    data: [],
    labels: [],
    name: 'AAPL'
  }
  refreshData(data: any) {
    this.chartData.data.push(data.data[0].content[0]['1'])
    console.log(this.chartData.data)
    this.createOrUpdateChart()
  }
  updateChart() {
    this.stockChart.data.datasets[0].data = this.chartData.data
    this.stockChart.update()
  }
  public stockChart: any
  createOrUpdateChart() {
    let chartInstance = Chart.getChart("stock-chart")
    if (chartInstance != undefined) {
      this.stockChart.update()
    }
    else{
      this.stockChart = new Chart("stock-chart", {
        type: 'line', //this denotes tha type of chart
  
        data: {// values on X-Axis
  
  
  
          datasets: [
            {
              label: this.chartData.name,
              data: this.chartData.data,
              backgroundColor: '#54C964',
              hoverBackgroundColor: '#54C964',
              borderColor: 'hsl(18, 12%, 60%)',
            }
          ]
        },
        options: {
  
          aspectRatio: 3.5,
          color: '#DBD4D1',
          font: {
            weight: 'bold'
          },
  
          scales: {
            y: {
              max: this.getMaxForChart(this.chartData.data),
              min: this.getMinForChart(this.chartData.data),
              grid: {
                color: 'hsl(18, 12%, 60%)'
              },
            },
            x: {
              grid: {
                color: 'hsl(18, 12%, 60%)'
              },
  
            }
  
          }
        }
      })
    }
    
  }

  getMaxForChart(arr: number[]): number {
    let max = -1000000
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] > max) {
        max = arr[i]
      }
    }
    return max + 10

  }
  getMinForChart(arr: number[]): number {
    let min = 1000000
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] < min) {
        min = arr[i]
      }
    }
    return min - 10

  }

  endStream(){
    console.log(this.schwabWebsocket)
    this.schwabWebsocket!.close()
    console.log(this.schwabWebsocket)
  }



  async ngOnInit() {
    Chart.register(annotationPlugin);
    Chart.register(...registerables)
    let user = await remult.initUser()
    await this.getUserData()
    this.startWebsocket()
    this.userSimFinData = await SimFinance.getSimFinData()
  }

}
