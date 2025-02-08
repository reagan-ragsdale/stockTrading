import { Component, inject, OnInit } from '@angular/core';
import { SimFInance } from '../../shared/tasks/simFinance';
import { SimFinance } from '../../shared/controllers/SimFinance';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MatDialog,MatDialogActions,MatDialogClose,MatDialogContent,MatDialogRef,MatDialogTitle} from '@angular/material/dialog';
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
  constructor(private sharedCache: CachedData) {}
  remult = remult
  readonly dialog = inject(MatDialog);



  accountNum: any = 0
  userPreferenceData: any = {}
  userSimFinData: SimFInance | null = null
  userData: any = []
  canShowAddFunds: boolean = true;
  accessToken = ''
  schwabWebsocket: WebSocket | null = null
  hasBeenSent: boolean = false
  stockChart: any
  moversData: any = []

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
            "fields": "0,1,2,3,4,5,6,7,8,9,10,33"
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
        if(Object.hasOwn(data.data[0].content[0], '3')){
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
    this.chartData.data.push(data.data[0].content[0]['3'])
    this.chartData.labels.push(data.data[0].timestamp)
    console.log(this.chartData.data)
    this.createOrUpdateChart()
  }
  updateChart() {
    let dataNew = this.chartData.data.slice()
    let labelsNew = this.chartData.labels.slice()
    this.stockChart.data.datasets[0].data = dataNew
    this.stockChart.data.datasets[0].labels = labelsNew
    this.stockChart.update()
  }
  
  createOrUpdateChart() {
    let chartInstance = Chart.getChart("stock-chart")
    if (chartInstance != undefined) {
      this.updateChart()
      console.log('update chart')
    }
    else{
      console.log('create chart')
      this.stockChart = new Chart("stock-chart", {
        type: 'line', //this denotes tha type of chart
  
        data: {// values on X-Axis
  
          labels: this.chartData.labels,
  
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
   let logoutMsg = {
      "requests": [
        {
          "service": "ADMIN",
          "requestid": "10",
          "command": "LOGOUT",
          "SchwabClientCustomerId": this.userPreferenceData.streamerInfo[0].schwabClientCustomerId,
          "SchwabClientCorrelId": this.userPreferenceData.streamerInfo[0].schwabClientCorrelId,
          "parameters": ''
        }
      ]
    }
    this.schwabWebsocket!.send(JSON.stringify(logoutMsg))
    console.log(this.schwabWebsocket)
    this.schwabWebsocket!.close()
    console.log(this.schwabWebsocket)
  }

  async getMovers(){
    const url = 'https://api.schwabapi.com/marketdata/v1/movers/NYSE';
    let payload = new URLSearchParams({
            sort: 'PERCENT_CHANGE_UP', frequency: '1'
        })
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: payload
      
    };
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      this.moversData = result
      console.log(this.moversData)
    }
    catch (error: any) {
      console.log(error.message)
    }
  }



  async ngOnInit() {
    Chart.register(annotationPlugin);
    Chart.register(...registerables)
    let user = await remult.initUser()
    await this.getUserData()
    await this.getMovers()
    //this.startWebsocket()
    this.userSimFinData = await SimFinance.getSimFinData()
  }

}
