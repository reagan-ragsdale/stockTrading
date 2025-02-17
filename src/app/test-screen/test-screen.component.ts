import { Component, inject, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { SimFInance } from '../../shared/tasks/simFinance';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { CachedData } from '../services/cachedDataService';
import { remult } from 'remult';
import { Chart, InteractionModeFunction, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { DbOrders } from '../../shared/tasks/dbOrders';
import { AnalysisService } from '../services/analysisService';
import { StockAnalysisDto } from '../Dtos/stockAnalysisDto';
import { stockOrder } from '../Dtos/stockOrder';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { UsersStocks } from '../../shared/tasks/usersStocks';
import { stockOwnedData } from '../Dtos/stockOwnedData';
import { reusedFunctions } from '../services/reusedFunctions.js';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input';
import { buySellDto } from '../Dtos/buySellDto';
import { TestAddFundsComponent } from './test-add-funds/test-add-funds.component';
import { RegFinanceController } from '../../shared/controllers/regressionFInanceController';
import { TestTradeComponent } from './test-trade/test-trade.component';
import { RegressionStockController } from '../../shared/controllers/RegressionStockController';
import { RegressionOrderController } from '../../shared/controllers/RegressionOrderController';
import { RegressionOrderService } from '../services/regressionOrderService';
import {MatMenuModule} from '@angular/material/menu';
import { Router } from '@angular/router';
import { DbCurrentDayStockData, dbCurrentDayStockDataRepo } from '../../shared/tasks/dbCurrentDayStockData';
@Component({
  selector: 'app-test-screen',
  imports: [CommonModule, FormsModule,TestTradeComponent,MatMenuModule, MatInputModule, MatFormFieldModule, MatIconModule, MatRadioModule, MatProgressSpinnerModule, MatButtonModule, MatButtonToggleModule],
  templateUrl: './test-screen.component.html',
  styleUrl: './test-screen.component.css'
})
export class TestScreenComponent implements OnInit, OnDestroy {
  constructor(private sharedCache: CachedData, private router: Router) { }
  remult = remult
  readonly dialog = inject(MatDialog);
  @ViewChild('modalTemplate', { static: true }) modalTemplate!: TemplateRef<any>;



  accountNum: any = 0
  userPreferenceData: any = {}
  userSimFinData: SimFInance[] = [{ savings: 0, spending: 0, userId: '' }]
  userData: any = []
  canShowAddFunds: boolean = true;
  accessToken = ''
  schwabWebsocket: WebSocket | null = null
  hasBeenSent: boolean = false
  stockChart: any
  volumeChart: any
  moversData: any = []
  openOrder: boolean = false
  lastOrder: DbOrders | null = null
  isUserOrBot: string = 'User'
  unsubscribe = () => { }
  selectedStockHigh: number = 0
  selectedStockLow: number = 0
  selectedStockCurrent: number = 0
  selectedStockVolumeHigh: number = 0
  selectedStockVolumeLow: number = 0
  selectedStockVolumeCurrent: number = 0
  stockData: UsersStocks[] = []
  selectedStockName: string = ''
  selectedStockData: stockOwnedData = {
    shareQty: 0,
    stockName: ''
  }
  selectedStockTotalNet: number = 0
  stockHistoryData: DbOrders[] = []
  selectedStockHistoryData: DbOrders[] = []
  targetPrice: number = 0
  stopLossPrice: number = 0
  tradeInitialAverage: number = 0
  tradeCurrentHigh:number = 0
  isOrderPending: boolean = false;
  tempSelectedAlgo: string = ''
  selectedAlgo: string = ''
  tempTrendAlgoStartingPoint: number = 0
  trendAlgoStartingPoint: number = 0
  isBotAuthorized: boolean = false;
  isChangesToBot: boolean = false;

 
  showAddFunds() {
    const dialogRef = this.dialog.open(TestAddFundsComponent, {
      width: '300px',
      enterAnimationDuration: 0,
      exitAnimationDuration: 0
    });
    dialogRef.afterClosed().subscribe(async result => {
      this.userSimFinData = await RegFinanceController.getRegSimFinData()
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
      this.userSimFinData = await RegFinanceController.getRegSimFinData()
      console.log(result)
      //this.lastOrder = await OrderController.getLastOrder();
      await this.getStockData()

    });
  }
  async getStockData() {
    this.stockData = await RegressionStockController.getAllStocks()
    let selectedStock = this.stockData.filter(e => e.stockName == this.selectedStockName)
    this.selectedStockData = {
      stockName: selectedStock[0].stockName,
      shareQty: selectedStock[0].shareQty
    }
    this.stockHistoryData = await RegressionOrderController.getAllOrders()
    this.selectedStockHistoryData = this.stockHistoryData.filter(e => e.stockName == this.selectedStockName)

    //below is most likely not the best wat to find the net but it'll work for now
    for(let i = 0; i < this.selectedStockHistoryData.length - 1; i++){
      //need to find each pair of buy and sells
      if(this.selectedStockHistoryData[i].orderType == 'Sell' && this.selectedStockHistoryData[i + 1].orderType == 'Buy'){
        this.selectedStockTotalNet += ((this.selectedStockHistoryData[i].shareQty * this.selectedStockHistoryData[i].stockPrice) - (this.selectedStockHistoryData[i + 1].shareQty * this.selectedStockHistoryData[i + 1].stockPrice))
      }
    }
    console.log(this.selectedStockHistoryData)

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
      //add the level 2 data to this
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
        if (Object.hasOwn(data.data[0].content[0], '8')) {
          this.refreshVolumeData(data)
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
    time: [],
    volume: [],
    volumeTime: []
  }
  refreshVolumeData(data: any) {
    this.chartData.volume.push(data.data[0].content[0]['8'])
    this.chartData.volumeTime.push(Number(data.data[0].timestamp))
    this.selectedStockVolumeCurrent = this.chartData.volume[this.chartData.volume.length - 1]
    this.selectedStockVolumeHigh = Math.max(...this.chartData.volume)
    this.selectedStockVolumeLow = Math.min(...this.chartData.volume)
    this.updateVolumeChart()
  }
  chartInfo: DbCurrentDayStockData[] = [{
    stockName: '',
    stockPrice: 0,
    time: 0
  }]
  async refreshData(data: any) {
    this.chartInfo = data.slice()
    this.chartData.history = this.chartInfo.map(e => e.stockPrice)
    console.log(this.chartData.history)
    this.chartData.labels.push(reusedFunctions.epochToLocalTime(data.data[0].timestamp))
    this.chartData.time.push(Number(data.data[0].timestamp))
    this.selectedStockCurrent = this.chartInfo.map(e => e.stockPrice)[this.chartInfo.length - 1]
    this.selectedStockHigh = Math.max(...this.chartInfo.map(e => e.stockPrice))
    this.selectedStockLow = Math.min(...this.chartInfo.map(e => e.stockPrice))
    if (this.isUserOrBot == 'Bot' && this.isBotAuthorized == true && this.chartData.history.length >= 400) {
      let shouldPlaceOrder: buySellDto = {
        shouldExecuteOrder: false
      }
      if (this.selectedAlgo == 'highLow') {
        shouldPlaceOrder = AnalysisService.checkIsLowBuyIsHighSell(this.chartData.history.slice(-401), this.selectedStockHistoryData, this.stopLossPrice, this.tradeInitialAverage, this.tradeCurrentHigh)
      }
      else {
        shouldPlaceOrder = AnalysisService.trendTrading(this.chartData.history.slice((this.chartData.history.length - this.trendAlgoStartingPoint) * -1), this.selectedStockHistoryData)
      }


      //add check to see when the last order was placed. Don't want to be placing order every 3 seconds
      //maybe wait 30 seconds
      if (shouldPlaceOrder.shouldExecuteOrder == true && !this.isOrderPending) {
        await this.placeOrder(shouldPlaceOrder.isBuyOrSell!)
        this.stockChart.options.plugins.annotation.annotations.orderLine.yMin = this.selectedStockHistoryData[0]?.stockPrice
        this.stockChart.options.plugins.annotation.annotations.orderLine.yMax = this.selectedStockHistoryData[0]?.stockPrice
      }
      else{
        if(shouldPlaceOrder.stopLossPrice !== undefined){
          this.stopLossPrice = shouldPlaceOrder.stopLossPrice
        }
        if(shouldPlaceOrder.tradeHigh !== undefined){
          this.tradeCurrentHigh = shouldPlaceOrder.tradeHigh
        }
      }
      if (shouldPlaceOrder.targetPrice !== undefined) {
        this.targetPrice = shouldPlaceOrder.targetPrice
        this.stockChart.options.plugins.annotation.annotations.targetLine.yMin = this.targetPrice
        this.stockChart.options.plugins.annotation.annotations.targetLine.yMax = this.targetPrice
      }
    }
    this.updateChart()


  }
  updateChart() {
    this.stockChart.data.datasets[0].data = this.chartInfo.map(e => e.stockPrice)
    this.stockChart.data.datasets[0].labels = this.chartInfo.map(e => e.time)
    this.stockChart.options.scales.y.max = this.selectedStockHigh + 2
    this.stockChart.options.scales.y.min = this.selectedStockLow - 2
    this.stockChart.update()
  }
  updateVolumeChart() {
   

    this.volumeChart.options.scales.y.max = this.selectedStockVolumeHigh + 10000
    this.volumeChart.options.scales.y.min = this.selectedStockVolumeLow - 10000
    const rates = [];
    for (let i = 1; i < this.chartData.volumeTime.length; i++) {
      let rate = (this.chartData.volume[i] - this.chartData.volume[i - 1]) / (this.chartData.volumeTime[i] - this.chartData.volumeTime[i - 1]);
      rates.push(rate);
    }

    // Adjust time array to match the rates
    const rateTime = this.chartData.volumeTime.slice(1);
    this.volumeChart.data.datasets[0].data = rates
    this.volumeChart.data.datasets[0].labels = rateTime
    this.volumeChart.update()
  }

  createOrUpdateChart() {

    console.log('create chart')
    this.stockChart = new Chart("stock-chart", {
      type: 'line', //this denotes tha type of chart

      data: {// values on X-Axis

        labels: this.chartInfo.map(e => e.time),

        datasets: [
          {
            label: this.chartInfo[0].stockName,
            data: this.chartInfo.map(e => e.stockPrice),
            backgroundColor: '#54C964',
            hoverBackgroundColor: '#54C964',
            borderColor: '#54C964',
            pointBackgroundColor: '#54C964',
            pointBorderColor: '#54C964',
            pointRadius: 0,
            spanGaps: true

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
        animation: false,

        scales: {
          y: {
            max: this.getMaxForChart(this.chartData.volume),
            min: this.getMinForChart(this.chartData.volume),
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

        },
        plugins: {
          annotation: {
            annotations: {
              orderLine: {
                type: 'line',
                yMin: this.selectedStockHistoryData[0]?.stockPrice,
                yMax: this.selectedStockHistoryData[0]?.stockPrice,
                borderColor: '#7874ff',
                borderWidth: 2
              },
              targetLine: {
                type: 'line',
                yMin: this.targetPrice,
                yMax: this.targetPrice,
                borderColor: '#ff8f50',
                borderWidth: 2
              },
              stopLossLine: {
                type: 'line',
                yMin: this.stopLossPrice,
                yMax: this.stopLossPrice,
                borderColor: '#ea4c4c',
                borderWidth: 2
              },
              trendIndex: {
                type: 'line',
                xMin: this.trendAlgoStartingPoint,
                xMax: this.trendAlgoStartingPoint,
                borderColor: '#ff82e3',
                borderWidth: 2
              }
            }

          }
        }
      }
    })


  }

  createVolumeChart() {
    this.volumeChart = new Chart("volume-chart", {
      type: 'line', //this denotes tha type of chart

      data: {// values on X-Axis

        labels: this.chartData.labels,

        datasets: [
          {
            label: this.chartData.name,
            data: this.chartData.volume,
            backgroundColor: '#54C964',
            hoverBackgroundColor: '#54C964',
            borderColor: '#54C964',
            pointBackgroundColor: '#54C964',
            pointBorderColor: '#54C964',
            pointRadius: 0,
            spanGaps: true

          }
        ]
      },
      options: {

        aspectRatio: 9,
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
        animation: false,

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

  getMaxForChart(arr: number[]): number {
    let max = -1000000000
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] > max) {
        max = arr[i]
      }
    }
    return max + 2

  }
  getMinForChart(arr: number[]): number {
    let min = 1000000000
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] < min) {
        min = arr[i]
      }
    }
    return min - 2

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
  placeTrade() {

  }

  async placeOrder(buyOrSell: string) {
    this.isOrderPending = true;
    let order: stockOrder = {
      orderType: buyOrSell,
      stockName: this.selectedStockName,
      stockPrice: this.selectedStockCurrent,
      shareQty: this.userSimFinData[0].spending * this.selectedStockCurrent,
      orderTime: this.chartData.time[this.chartData.time.length - 1]
    }
    await RegressionOrderService.executeOrder(order, this.selectedStockHistoryData[0])
    await this.getUserFinanceData()
    await this.getStockData()
    this.isOrderPending = false
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
    this.userSimFinData = await RegFinanceController.getRegSimFinData()
  }

  userBotChange(event: any) {
    this.isUserOrBot = event.value
    if (this.isUserOrBot == 'User') {
      this.isBotAuthorized = false;
      this.trendAlgoStartingPoint = 0;
      this.tempTrendAlgoStartingPoint = 0;
      this.updateTrendIndexLine()
    }
  }
  onAlgoChanged(event: any) {
    this.tempSelectedAlgo = event.value
    this.isChangesToBot = true;
  }

  incomingTokensFromDB: any = []
  checkData(changes: any) {
    console.log(this.accessToken)
    this.sharedCache.changeAccessToken(changes[0].accessToken)
    this.sharedCache.currentAccessToken.subscribe(token => this.accessToken = token!)
    console.log(this.accessToken)
  }
  trendAlgoStartingPointChanged() {
    this.updateTrendIndexLine()
    this.isChangesToBot = true;
  }
  confirmAlgo() {
    this.isBotAuthorized = true;
    this.selectedAlgo = this.tempSelectedAlgo
    this.trendAlgoStartingPoint = this.tempTrendAlgoStartingPoint
    this.isChangesToBot = false;
  }
  resetAlgo() {
    this.tempTrendAlgoStartingPoint = this.trendAlgoStartingPoint
    this.updateTrendIndexLine()
    this.isChangesToBot = false;
  }

  updateTrendIndexLine() {
    this.stockChart.options.plugins.annotation.annotations.trendIndex.xMin = this.tempTrendAlgoStartingPoint
    this.stockChart.options.plugins.annotation.annotations.trendIndex.xMax = this.tempTrendAlgoStartingPoint
    this.stockChart.update()
  }
  onStartWebSocket(){
    this.startWebsocket()
  }
  navToLiveEnv(){
    this.router.navigate(['/home'])
  }

  startTestThing(){
    this.unsubscribe = dbCurrentDayStockDataRepo
       .liveQuery({
         where: DbCurrentDayStockData.getCurrentStockDataByName({stockName: 'AAPL'}),orderBy: {time: 'asc'}
       })
       .subscribe(info => this.refreshData(info.items)) 
  }
  isLoading: boolean = true;
  async ngOnInit() {
    Chart.register(annotationPlugin);
    Chart.register(...registerables)
    this.selectedStockName = 'AAPL'
    let user = await remult.initUser()
    await this.getUserData()
    //await this.getMovers()
    await this.getUserFinanceData()
    await this.getStockData()
    this.createOrUpdateChart()
    //this.createVolumeChart()
    
    this.startTestThing()
    /*  this.unsubscribe = rhRepo
       .liveQuery({
         where: Rhkeys.getTokenUpdates({})
       })
       .subscribe(info => this.checkData(info.items)) */
    //this.isLoading = false;

  }

  ngOnDestroy() {
    this.unsubscribe()
  }

}
