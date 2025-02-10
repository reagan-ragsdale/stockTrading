import { Component, inject, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { SimFInance } from '../../shared/tasks/simFinance';
import { SimFinance } from '../../shared/controllers/SimFinance.js';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { AddFundsComponent } from './add-funds/add-funds.component';
import { CachedData } from '../services/cachedDataService';
import { remult } from 'remult';
import { Chart, InteractionModeFunction, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { OrderController } from '../../shared/controllers/OrderController';
import { DbOrders } from '../../shared/tasks/dbOrders';
import { OrderService } from '../services/orderService';
import { AnalysisService } from '../services/analysisService';
import { StockAnalysisDto } from '../Dtos/stockAnalysisDto';
import { stockOrder } from '../Dtos/stockOrder';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Rhkeys, rhRepo } from '../../shared/tasks/rhkeys';
import { AuthController } from '../../shared/controllers/AuthController';
import { TradeComponent } from './trade/trade.component';
import { DialogRef } from '@angular/cdk/dialog';
import { StockController } from '../../shared/controllers/StockController';
import { UsersStocks } from '../../shared/tasks/usersStocks';
import { stockOwnedData } from '../Dtos/stockOwnedData';
import { reusedFunctions } from '../services/reusedFunctions.js';
@Component({
  selector: 'app-home-screen',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatButtonToggleModule, TradeComponent],
  templateUrl: './home-screen.component.html',
  styleUrl: './home-screen.component.css'
})
export class HomeScreenComponent implements OnInit, OnDestroy {
  constructor(private sharedCache: CachedData) { }
  remult = remult
  readonly dialog = inject(MatDialog);
  @ViewChild('modalTemplate', { static: true }) modalTemplate!: TemplateRef<any>;



  accountNum: any = 0
  userPreferenceData: any = {}
  userSimFinData: SimFInance[] = []
  userData: any = []
  canShowAddFunds: boolean = true;
  accessToken = ''
  schwabWebsocket: WebSocket | null = null
  hasBeenSent: boolean = false
  stockChart: any
  moversData: any = []
  openOrder: boolean = false
  lastOrder: DbOrders | null = null
  isUserOrBot: string = 'User'
  unsubscribe = () => { }
  selectedStockHigh: number = 0
  selectedStockLow: number = 0
  selectedStockCurrent: number = 0
  stockData: UsersStocks[] = []
  selectedStockName: string = ''
  selectedStockData: stockOwnedData = {
    shareQty: 0,
    stockName: ''
  }

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

  tradeDialogRef: any
  openTradePopup() {
    this.tradeDialogRef = this.dialog.open(this.modalTemplate, {
      width: '400px',
      enterAnimationDuration: 0,
      exitAnimationDuration: 0
    });
    this.tradeDialogRef.afterClosed().subscribe(async (result: any) => {
      this.userSimFinData = await SimFinance.getSimFinData()
      console.log(result)
      //this.lastOrder = await OrderController.getLastOrder();
      await this.getStockData()
      
    });
  }
  async getStockData(){
    this.stockData = await StockController.getAllStocks()
    let selectedStock = this.stockData.filter(e => e.stockName == this.selectedStockName)
    this.selectedStockData = {
      stockName: selectedStock[0].stockName,
      shareQty: selectedStock[0].shareQty
    }

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
        if (data.response[0].content.code == 0 && this.hasBeenSent == false) {
          this.schwabWebsocket!.send(JSON.stringify(aaplDataMsg))
          console.log('send aapl')
          this.hasBeenSent = true
        }
      }
      if (Object.hasOwn(data, 'data') && this.hasBeenSent == true) {
        if (Object.hasOwn(data.data[0].content[0], '3')) {
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

  chartData: StockAnalysisDto = {
    history: [],
    labels: [],
    name: 'AAPL',
    time: []
  }
  async refreshData(data: any) {
    this.chartData.history.push(data.data[0].content[0]['3'])
    this.chartData.labels.push(reusedFunctions.epochToLocalTime(data.data[0].timestamp))
    this.chartData.time.push(data.data[0].timestamp)
    console.log(this.chartData.history)
    this.selectedStockCurrent = this.chartData.history[this.chartData.history.length - 1]
    this.selectedStockHigh = Math.max(...this.chartData.history)
    this.selectedStockLow = Math.min(...this.chartData.history)
    this.createOrUpdateChart()
    if (this.isUserOrBot == 'Bot') {
      let shouldPlaceOrder = AnalysisService.checkIsLowBuyIsHighSell(this.chartData, this.openOrder)
      if (shouldPlaceOrder.shouldExecuteOrder == true) {
        await this.placeOrder(shouldPlaceOrder.isBuyOrSell!)
      }
    }

  }
  updateChart() {
    let dataNew = this.chartData.history.slice()
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
    else {
      console.log('create chart')
      this.stockChart = new Chart("stock-chart", {
        type: 'line', //this denotes tha type of chart

        data: {// values on X-Axis

          labels: this.chartData.labels,

          datasets: [
            {
              label: this.chartData.name,
              data: this.chartData.history,
              backgroundColor: '#54C964',
              hoverBackgroundColor: '#54C964',
              borderColor: '#54C964',
              pointBackgroundColor: '#54C964',
              pointBorderColor: '#54C964',
            }
          ]
        },
        options: {

          aspectRatio: 2,
          color: '#DBD4D1',
          font: {
            weight: 'bold'
          },
          elements: {
            line: {
              backgroundColor: '#54C964',
              borderColor: '#54C964'
            },
            point: {
              radius: 1,
              hitRadius: 3
            }
          },
          animation:{
            duration: 0
          },

          scales: {
            y: {
              max: this.getMaxForChart(this.chartData.history),
              min: this.getMinForChart(this.chartData.history),
              grid: {
                color: 'hsl(18, 12%, 60%)'
              },
            },
            x: {
              grid: {
                display: false,
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
    return max + 5

  }
  getMinForChart(arr: number[]): number {
    let min = 1000000
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] < min) {
        min = arr[i]
      }
    }
    return min - 5

  }

  endStream() {
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

  tradeBuyOrSell = 'Buy'
  placeTrade(){

  }

  async placeOrder(buyOrSell: string) {
    let order: stockOrder = {
      orderType: buyOrSell,
      stockName: this.chartData.name,
      stockPrice: this.chartData.history[this.chartData.history.length - 1],
      //figure out how many shares to buy
      shareQty: 1,
      orderTime: this.chartData.time[this.chartData.time.length - 1]
    }
    this.openOrder = await OrderService.executeOrder(order)
    await this.getUserFinanceData()
  }

  async getMovers() {
    const url = 'https://api.schwabapi.com/marketdata/v1/movers/NYSE?sort=PERCENT_CHANGE_UP&frequency=1';
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }

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

  async getUserFinanceData() {
    this.userSimFinData = await SimFinance.getSimFinData()
  }

  userBotChange(event: any) {
    this.isUserOrBot = event.value
  }

  incomingTokensFromDB: any = []
  checkData(changes: any){
    console.log(this.accessToken)
    this.sharedCache.changeAccessToken(changes[0].accessToken)
    this.sharedCache.currentAccessToken.subscribe(token => this.accessToken = token!)
    console.log(this.accessToken)
  }

  async ngOnInit() {
    Chart.register(annotationPlugin);
    Chart.register(...registerables)
    this.selectedStockName = 'AAPL'
    let user = await remult.initUser()
    await this.getUserData()
    this.lastOrder = await OrderController.getLastOrder();
    if (this.lastOrder?.orderType == 'Buy') {
      this.openOrder = true
    }
    //await this.getMovers()
    this.startWebsocket()
    await this.getUserFinanceData()
    await this.getStockData()
    this.unsubscribe = rhRepo
      .liveQuery({
        where: Rhkeys.getTokenUpdates({})
      })
      .subscribe(info => this.checkData(info.items))

  }

  ngOnDestroy(){
    this.unsubscribe()
  }

}
