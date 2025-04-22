import { Component, inject, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { SimFInance } from '../../shared/tasks/simFinance';
import { SimFinance } from '../../shared/controllers/SimFinance.js';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AddFundsComponent } from './add-funds/add-funds.component';
import { CachedData } from '../services/cachedDataService';
import { remult } from 'remult';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { OrderController } from '../../shared/controllers/OrderController';
import { DbOrders } from '../../shared/tasks/dbOrders';
import { OrderService } from '../services/orderService';
import { AnalysisService } from '../services/analysisService';
import { StockAnalysisDto } from '../Dtos/stockAnalysisDto';
import { stockOrder } from '../Dtos/stockOrder';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TradeComponent } from './trade/trade.component';
import { StockController } from '../../shared/controllers/StockController';
import { UsersStocks } from '../../shared/tasks/usersStocks';
import { stockOwnedData } from '../Dtos/stockOwnedData';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input';
import { buySellDto } from '../Dtos/buySellDto';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { DbCurrentDayStockData, dbCurrentDayStockDataRepo } from '../../shared/tasks/dbCurrentDayStockData';
import { MatSelectModule } from '@angular/material/select';
import { reusedFunctions } from '../services/reusedFunctions';
import { dbTokenRepo, DbTOkens } from '../../shared/tasks/dbTokens';
import { setSessionUser } from '../../server/server-session';
import { AuthController } from '../../shared/controllers/AuthController';
import {MatTableModule} from '@angular/material/table';
import { EpochToTimePipe } from "../services/epochToTimePipe.pipe";
import { userRepo } from '../../shared/tasks/Users';
import { DashboardComponent } from "../dashboard/dashboard.component";
import { dbStockBasicHistoryRepo } from '../../shared/tasks/dbStockBasicHistory';
import { AddGraphComponent } from "./add-graph/add-graph.component";

type lineType = {
  id: number,
  smaLength: number
}
//import { WebSocket } from 'ws';
@Component({
  selector: 'app-home-screen',
  imports: [CommonModule, FormsModule, MatTableModule, MatSelectModule, MatInputModule, MatMenuModule, MatFormFieldModule, MatIconModule, MatRadioModule, MatProgressSpinnerModule, MatButtonModule, MatButtonToggleModule, TradeComponent, EpochToTimePipe, AddGraphComponent],
  templateUrl: './home-screen.component.html',
  styleUrl: './home-screen.component.css'
})
export class HomeScreenComponent implements OnInit, OnDestroy {
  constructor(private sharedCache: CachedData, private router: Router) { }
  remult = remult
  readonly dialog = inject(MatDialog);
  @ViewChild('modalTemplate', { static: true }) modalTemplate!: TemplateRef<any>;
  @ViewChild('addLineTemplate', { static: true }) addLineTemplate!: TemplateRef<any>;



  accountNum: any = 0
  userPreferenceData: any = {}
  userSimFinData: SimFInance[] = [{ savings: 0, spending: 0, userId: '' }]
  userData: DbTOkens | null = null
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
  tradeCurrentHigh: number = 0
  isOrderPending: boolean = false;
  tempSelectedAlgo: string = ''
  selectedAlgo: string = ''
  tempTrendAlgoStartingPoint: number = 0
  trendAlgoStartingPoint: number = 0
  isBotAuthorized: boolean = false;
  isChangesToBot: boolean = false;
  distinctAvailableStocks: string[] = []
  selectedStopLossPrice: number = 0;
  selectedStopLossAdjustmentAmt: number = 0
  trendGutterTemp: number = 0.45;
  trendGutterFinal: number = .45;
  stopLossLagTemp: number = .25;
  stopLossLagFinal: number = 0;
  stockOpenPrice: number = 0;
  stockVariance: number = 0;
  stockVarianceHigh: number = 0;
  stockVarianceLow: number = 0;

  displayedColumns: string[] = ["Trade", "Stock","Shares","Price","Time"]

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
      await this.getStockInfo()

    });
  }
  addLineDialogRef: any
  addLineToGraph(){
    this.addLineDialogRef = this.dialog.open(this.addLineTemplate, {
      width: '400px',
      enterAnimationDuration: 0,
      exitAnimationDuration: 0
    });
    this.addLineDialogRef.afterClosed().subscribe(async (result: any) => {
      if(result.length > 0){
        console.log(result)
        this.addNewLinesToGraph(result)
      }

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
  async getStockInfo() {
    this.selectedStockTotalNet = 0
    this.stockData = await StockController.getAllStocks()
    let selectedStock = this.stockData.filter(e => e.stockName == this.selectedStockName)
    this.selectedStockData = {
      stockName: selectedStock.length > 0 ? selectedStock[0].stockName : '',
      shareQty: selectedStock.length > 0 ? selectedStock[0].shareQty : 0
    }
    this.stockHistoryData = await OrderController.getAllOrders()
    this.selectedStockHistoryData = this.stockHistoryData.filter(e => e.stockName == this.selectedStockName)

    //below is most likely not the best wat to find the net but it'll work for now
    for (let i = 0; i < this.selectedStockHistoryData.length - 1; i++) {
      //need to find each pair of buy and sells
      if (this.selectedStockHistoryData[i].orderType == 'Sell' && this.selectedStockHistoryData[i + 1].orderType == 'Buy') {
        this.selectedStockTotalNet += ((this.selectedStockHistoryData[i].shareQty * this.selectedStockHistoryData[i].stockPrice) - (this.selectedStockHistoryData[i + 1].shareQty * this.selectedStockHistoryData[i + 1].stockPrice))
      }
    }
    console.log(this.selectedStockHistoryData)

  }
  startWebsocket() {
    this.schwabWebsocket = new WebSocket(this.userData!.streamerSocketUrl)
    let hasBeenSent = false
    const loginMsg = {
      "requests": [
        {
          "service": "ADMIN",
          "requestid": "0",
          "command": "LOGIN",
          "SchwabClientCustomerId": this.userData!.schwabClientCustomerId,
          "SchwabClientCorrelId": this.userData!.schwabClientCorrelId,
          "parameters": {
            "Authorization": this.userData!.accessToken,
            "SchwabClientChannel": this.userData!.schwabClientChannel,
            "SchwabClientFunctionId": this.userData!.schwabClientFunctionId
          }
        }
      ]
    }
    const socketSendMsg = {
      "requests": [
        {
          "service": "LEVELONE_EQUITIES",
          "requestid": "1",
          "command": "SUBS",
          "SchwabClientCustomerId": this.userData!.schwabClientCustomerId,
          "SchwabClientCorrelId": this.userData!.schwabClientCorrelId,
          "parameters": {
            "keys": "AAPL, MSFT, PLTR, AMD, TSLA, XOM,NVO, NEE, BAC, NVDA",
            "fields": "0,1,2,3,4,5,6,7,8,9,10,33"
          }
        }
      ]
    }
    this.schwabWebsocket.onopen = () => {
      this.schwabWebsocket!.send(JSON.stringify(loginMsg))
    }
    this.schwabWebsocket.onmessage = async (event) => {
      console.log(JSON.parse(event.data.toString()))
      let newEvent = JSON.parse(event.data.toString())


      if (Object.hasOwn(newEvent, 'response')) {
        if (newEvent.response[0].requestid == 0 && hasBeenSent == false) {
          this.schwabWebsocket!.send(JSON.stringify(socketSendMsg))
          hasBeenSent = true
        }
      }
      try {
        if (Object.hasOwn(newEvent, 'data') && hasBeenSent == true) {
          if (newEvent.data[0].service == 'LEVELONE_EQUITIES') {
            for (let i = 0; i < newEvent.data[0].content.length; i++) {
              if (Object.hasOwn(newEvent.data[0].content[i], '3') && newEvent.data[0].content[i].key == this.selectedStockName) {
                this.chartInfo.push({
                  stockName: newEvent.data[0].content[i].key,
                  stockPrice: newEvent.data[0].content[i]['3'],
                  askPrice: 0,
                  bidPrice: 0,
                  time: Number(newEvent.data[0].timestamp),
                  volume: newEvent.data[0].content[i]['8']
                })
                console.log(this.chartData)
                await this.refreshData()
                
              }
            }
          }
        }
      }
      catch (error: any) {
        console.log(error.message)
      }

    }
  }

  chartData: StockAnalysisDto = {
    history: [],
    labels: [],
    name: '',
    time: [],
    volume: [],
    volumeTime: []
  }
  refreshVolumeData() {
    this.chartData.volume.push(this.chartInfo[this.chartInfo.length - 1].volume - this.chartInfo[this.chartInfo.length - 2].volume)
    this.updateVolumeChart()
  }
  getInitialVolumeData(){
    this.chartData.volume = []
    for(let i = 1; i < this.chartInfo.length; i++){
      this.chartData.volume.push(this.chartInfo[i].volume - this.chartInfo[i - 1].volume)
    }
  }
  chartInfo: DbCurrentDayStockData[] = [{
    stockName: '',
    stockPrice: 0,
    askPrice: 0,
    bidPrice: 0,
    time: 0,
    volume: 0
  }]
  async refreshData() {
    this.chartData.history = this.chartInfo.map(e => e.stockPrice)
    this.chartData.labels = this.chartInfo.map(e => new Date(e.time).toLocaleTimeString())
    this.chartData.time = this.chartInfo.map(e => e.time)
    this.selectedStockCurrent = this.chartData.history[this.chartData.history.length - 1]
    this.selectedStockHigh = Math.max(...this.chartData.history)
    this.selectedStockLow = Math.min(...this.chartData.history)
    this.stockVariance = (this.chartData.history[this.chartData.history.length - 1] - this.stockOpenPrice) / this.stockOpenPrice
    if(this.listOfAddedLines.length > 0){
      this.refreshAddedLines()
    }
    /* if (this.isUserOrBot == 'Bot' && this.isBotAuthorized == true && !this.isOrderPending) {
      let shouldPlaceOrder: buySellDto = {
        shouldExecuteOrder: false
      }
      if (this.selectedAlgo == 'highLow') {
        shouldPlaceOrder = AnalysisService.checkIsLowBuyIsHighSell(this.chartData.history.slice((this.chartData.history.length - this.trendAlgoStartingPoint) * -1), this.selectedStockHistoryData, this.stopLossPrice, this.tradeInitialAverage, this.tradeCurrentHigh, this.trendGutterFinal, this.stopLossLagFinal)
      }
      else if(this.selectedAlgo == 'trend'){
        shouldPlaceOrder = AnalysisService.trendTrading(this.chartData.history.slice((this.chartData.history.length - this.trendAlgoStartingPoint) * -1), this.selectedStockHistoryData, this.stopLossPrice, this.tradeCurrentHigh, this.tradeInitialAverage, this.trendGutterFinal, this.stopLossLagFinal)
      }
      else if(this.selectedAlgo == 'followUp'){
        shouldPlaceOrder = AnalysisService.followUp(this.chartData.history[this.chartData.history.length - 1], this.selectedStockHistoryData, this.stopLossPrice, this.tradeCurrentHigh, this.tradeInitialAverage, this.selectedStopLossAdjustmentAmt)
      }

      //add check to see when the last order was placed. Don't want to be placing order every 3 seconds
      //maybe wait 30 seconds
      if (shouldPlaceOrder.shouldExecuteOrder == true) {
        if (!this.isOrderPending) {
          await this.placeOrder(shouldPlaceOrder.isBuyOrSell!)
          this.stopLossPrice = shouldPlaceOrder.stopLossPrice!
          this.tradeCurrentHigh = shouldPlaceOrder.tradeHigh!
          this.tradeInitialAverage = shouldPlaceOrder.initialAverage!
          this.stockChart.options.plugins.annotation.annotations.orderLine.yMin = this.selectedStockHistoryData[0]?.stockPrice
          this.stockChart.options.plugins.annotation.annotations.orderLine.yMax = this.selectedStockHistoryData[0]?.stockPrice
          this.stockChart.options.plugins.annotation.annotations.avgLine.yMin = this.tradeInitialAverage
          this.stockChart.options.plugins.annotation.annotations.avgLine.yMax = this.tradeInitialAverage
          if (shouldPlaceOrder.soldAtStopLoss == true) {
            this.isBotAuthorized = false;
          }
        }

      }
      else {

        if (shouldPlaceOrder.stopLossPrice !== undefined) {
          this.stopLossPrice = shouldPlaceOrder.stopLossPrice
          this.stockChart.options.plugins.annotation.annotations.stopLossLine.yMin = this.stopLossPrice
          this.stockChart.options.plugins.annotation.annotations.stopLossLine.yMax = this.stopLossPrice
        }
        if (shouldPlaceOrder.tradeHigh !== undefined) {
          this.tradeCurrentHigh = shouldPlaceOrder.tradeHigh
        }
      }
      if (shouldPlaceOrder.targetPrice !== undefined) {
        this.targetPrice = shouldPlaceOrder.targetPrice
        this.stockChart.options.plugins.annotation.annotations.targetLine.yMin = this.targetPrice
        this.stockChart.options.plugins.annotation.annotations.targetLine.yMax = this.targetPrice
      }
      if(shouldPlaceOrder.containsTrendInfo == true){
         this.stockChart.options.plugins.annotation.annotations.trendLine.xMin = shouldPlaceOrder.xMin! + this.trendAlgoStartingPoint
         this.stockChart.options.plugins.annotation.annotations.trendLine.xMax = shouldPlaceOrder.xMax! + this.trendAlgoStartingPoint
         this.stockChart.options.plugins.annotation.annotations.trendLine.yMin = shouldPlaceOrder.yMin
         this.stockChart.options.plugins.annotation.annotations.trendLine.yMax = shouldPlaceOrder.yMax
         this.stockChart.options.plugins.annotation.annotations.trendLineAbove.xMin = shouldPlaceOrder.xMin! + this.trendAlgoStartingPoint
         this.stockChart.options.plugins.annotation.annotations.trendLineAbove.xMax = shouldPlaceOrder.xMax! + this.trendAlgoStartingPoint
         this.stockChart.options.plugins.annotation.annotations.trendLineAbove.yMin = shouldPlaceOrder.aboveyMin!
         this.stockChart.options.plugins.annotation.annotations.trendLineAbove.yMax = shouldPlaceOrder.aboveyMax!
         this.stockChart.options.plugins.annotation.annotations.trendLineBelow.xMin = shouldPlaceOrder.xMin! + this.trendAlgoStartingPoint
         this.stockChart.options.plugins.annotation.annotations.trendLineBelow.xMax = shouldPlaceOrder.xMax! + this.trendAlgoStartingPoint
         this.stockChart.options.plugins.annotation.annotations.trendLineBelow.yMin = shouldPlaceOrder.belowyMin!
         this.stockChart.options.plugins.annotation.annotations.trendLineBelow.yMax = shouldPlaceOrder.belowyMax!
         this.stockChart.options.plugins.annotation.annotations.gutterLineAbove.xMin = shouldPlaceOrder.xMin! + this.trendAlgoStartingPoint
         this.stockChart.options.plugins.annotation.annotations.gutterLineAbove.xMax = shouldPlaceOrder.xMax! + this.trendAlgoStartingPoint
         this.stockChart.options.plugins.annotation.annotations.gutterLineAbove.yMin = shouldPlaceOrder.gutterLineAboveMin!
         this.stockChart.options.plugins.annotation.annotations.gutterLineAbove.yMax = shouldPlaceOrder.gutterLineAboveMax!
         this.stockChart.options.plugins.annotation.annotations.gutterLineBelow.xMin = shouldPlaceOrder.xMin! + this.trendAlgoStartingPoint
         this.stockChart.options.plugins.annotation.annotations.gutterLineBelow.xMax = shouldPlaceOrder.xMax! + this.trendAlgoStartingPoint
         this.stockChart.options.plugins.annotation.annotations.gutterLineBelow.yMin = shouldPlaceOrder.gutterLineBelowMin!
         this.stockChart.options.plugins.annotation.annotations.gutterLineBelow.yMax = shouldPlaceOrder.gutterLineBelowMax! 
      }
    } */
    this.updateChart()
    if(this.stockChart.data.datasets.length > 1){
    
    }
    


  }
  refreshAddedLines(){
    for(let i = 0; i < this.listOfAddedLines.length; i++){
      let selectedSma = this.listOfSmaLines.filter(e => e.smaLength == this.listOfAddedLines[i].smaLength)[0].smaValues
      let previousVal = selectedSma[selectedSma.length - 1].avg * this.listOfAddedLines[i].smaLength
      previousVal += this.chartData.history[this.chartData.history.length - 1] - selectedSma[selectedSma.length - this.listOfAddedLines[i].smaLength].close
      selectedSma.push({stockName: this.selectedStockName, close: this.chartData.history[this.chartData.history.length - 1], avg: previousVal / this.listOfAddedLines[i].smaLength, date: new Date(this.chartData.time[this.chartData.time.length - 1]).toLocaleTimeString()})
      let selectedDataSet = this.stockChart.data.datasets.filter((e: { label: string; }) => e.label == this.listOfAddedLines[i].smaLength.toString())
      console.log(selectedSma.length)
      console.log(selectedDataSet)
      selectedDataSet.data = selectedSma.smaValues
    }
  }
  submitFollowUp(){
    this.isBotAuthorized = true;
    this.selectedAlgo = this.tempSelectedAlgo
    this.stopLossPrice = this.selectedStopLossPrice
  }
  updateChart() {
    this.stockChart.data.datasets[0].data = this.chartData.history.slice()
    this.stockChart.data.labels = this.chartData.labels.slice()
    this.stockChart.options.scales.y.max = this.selectedStockHigh + 2
    this.stockChart.options.scales.y.min = this.selectedStockLow - 2
    this.stockChart.update()
  }
  updateVolumeChart() {
    /* const rates = [];
    for (let i = 1; i < this.chartData.volumeTime.length; i++) {
      let rate = (this.chartData.volume[i] - this.chartData.volume[i - 1]) / (this.chartData.volumeTime[i] - this.chartData.volumeTime[i - 1]);
      rates.push(rate);
    } */

    // Adjust time array to match the rates
    //const rateTime = this.chartData.volumeTime.slice(1);
    //this.volumeChart.options.scales.y.max = Math.max(...this.chartData.volume) + 2
    this.volumeChart.data.datasets[0].data = this.chartData.volume.slice()
    this.volumeChart.data.labels = this.chartData.labels.slice()
    this.volumeChart.update()
  }
  listOfBGCOlors: string[] = ['#d82c2c', '#eeb528', '#1ca0de']
  listOfAddedLines: lineType[] = []
  listOfSmaLines: any[] = []
  addNewLinesToGraph(listOfLines: any[]){
    this.listOfAddedLines = []
    let newLines = [...listOfLines]
    console.log('here addNewLinesToGraph')
    this.stockChart.data.datasets = [this.stockChart.data.datasets[0]]
    console.log(this.stockChart.data.datasets)
    
    console.log(newLines.length)
    for(let i = 0; i < newLines.length; i++){
      console.log('here 2: ' + i )
      this.listOfAddedLines.push({id: i, smaLength: newLines[i].smaLength})
      let smaResult = this.calculateSma(newLines[i].smaLength)
      this.listOfSmaLines.push({smaLength: newLines[i].smaLength, smaValues: smaResult})
      let newData: any[] = []
      for(let j = 0; j < newLines[i].smaLength - 1; j++){
        newData.push(null)
      }
      newData.push(...smaResult.map(e => e.avg))
      this.stockChart.data.datasets.push({
            label: newLines[i].smaLength.toString(),
            data: newData,
            backgroundColor: this.listOfBGCOlors[i],
            hoverBackgroundColor: this.listOfBGCOlors[i],
            borderColor: this.listOfBGCOlors[i],
            pointBackgroundColor: this.listOfBGCOlors[i],
            pointBorderColor: this.listOfBGCOlors[i],
            pointRadius: 0,
            spanGaps: true
      })
    }
    console.log('done addNewLinesToGraph')
    this.stockChart.update()
  }
  calculateSma(lengthOfSma: number){
    console.log('here 3')
    let returnArray: any[] = []
    let windowSum = 0
    for(let i = 0; i < lengthOfSma; i++){
      windowSum += this.chartInfo[i].stockPrice
    }
    returnArray.push({stockName: this.selectedStockName, close: this.chartInfo[lengthOfSma -1].stockPrice, avg: windowSum / lengthOfSma, date: new Date(this.chartInfo[lengthOfSma -1].time).toLocaleTimeString()})
    for(let j = lengthOfSma; j < this.chartInfo.length; j++){
      windowSum += this.chartInfo[j].stockPrice - this.chartInfo[j - lengthOfSma].stockPrice
      returnArray.push({stockName: this.selectedStockName, close: this.chartInfo[j].stockPrice, avg: windowSum / lengthOfSma, date: new Date(this.chartInfo[j].time).toLocaleTimeString()})
    }
    console.log('here 4')
    return returnArray
  }
  createOrUpdateChart() {

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
                //display: this.selectedStockHistoryData.length > 0,
                yMin: this.selectedStockHistoryData.length > 0 ? this.selectedStockHistoryData[0]?.stockPrice : 0,
                yMax: this.selectedStockHistoryData.length > 0 ? this.selectedStockHistoryData[0]?.stockPrice : 0,
                borderColor: '#7874ff',
                borderWidth: 2,
                label: {
                  content: 'Previous Order'
                }
              },
              targetLine: {
                type: 'line',
                //display: this.targetPrice != 0,
                yMin: this.targetPrice,
                yMax: this.targetPrice,
                borderColor: '#ff8f50',
                borderWidth: 2,
                label: {
                  content: 'Target'
                }
              },
              stopLossLine: {
                type: 'line',
                //display: this.stopLossPrice != 0,
                yMin: this.stopLossPrice,
                yMax: this.stopLossPrice,
                borderColor: '#ea4c4c',
                borderWidth: 2,
                label: {
                  content: 'Stop Loss'
                }
              },
              avgLine: {
                type: 'line',
                //display: this.tradeInitialAverage != 0,
                yMin: this.tradeInitialAverage,
                yMax: this.tradeInitialAverage,
                borderColor: '#9dfd01',
                borderWidth: 2,
                label: {
                  content: 'Stop Loss'
                }
              },
              trendIndex: {
                type: 'line',
                //display: this.tempTrendAlgoStartingPoint != 0,
                xMin: this.trendAlgoStartingPoint,
                xMax: this.trendAlgoStartingPoint,
                borderColor: '#ff82e3',
                borderWidth: 2
              },
              trendLine: {
                type: 'line',
                //display: this.tempTrendAlgoStartingPoint != 0,
                xMin: 0,
                xMax: 0,
                yMin: 0,
                yMax: 0,
                borderColor: '#040502',
                borderWidth: 2
              },
              trendLineAbove: {
                type: 'line',
                //display: this.tempTrendAlgoStartingPoint != 0,
                xMin: 0,
                xMax: 0,
                yMin: 0,
                yMax: 0,
                borderColor: '#5afefc',
                borderWidth: 2,
                //white
              },
              trendLineBelow: {
                type: 'line',
                //display: this.tempTrendAlgoStartingPoint != 0,
                xMin: 0,
                xMax: 0,
                yMin: 0,
                yMax: 0,
                borderColor: '#5afefc',
                borderWidth: 2,
                //grey
              },
              gutterLineAbove: {
                type: 'line',
                //display: this.tempTrendAlgoStartingPoint != 0,
                xMin: 0,
                xMax: 0,
                yMin: 0,
                yMax: 0,
                borderColor: '#ff2b2b',
                borderWidth: 2,
                //red
              },
              gutterLineBelow: {
                type: 'line',
                //display: this.tempTrendAlgoStartingPoint != 0,
                xMin: 0,
                xMax: 0,
                yMin: 0,
                yMax: 0,
                borderColor: '#ff2b2b',
                borderWidth: 2,
                //blue
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
            display: false,
            //max: 10,
            //min: 0,
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
          "SchwabClientCustomerId": this.userData!.schwabClientCustomerId,
          "SchwabClientCorrelId": this.userData!.schwabClientCorrelId,
          "parameters": ''
        }
      ]
    }
    this.schwabWebsocket!.send(JSON.stringify(logoutMsg))
    this.schwabWebsocket!.close()
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
      shareQty: buyOrSell == 'Buy' ? this.userSimFinData[0].spending / this.selectedStockCurrent : this.selectedStockData.shareQty,
      orderTime: this.chartData.time[this.chartData.time.length - 1]
    }
    await OrderService.executeOrder(order, this.selectedStockHistoryData[0])
    await this.getUserFinanceData()
    await this.getStockInfo()
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
    this.userSimFinData = await SimFinance.getSimFinData()
  }

  userBotChange(event: any) {
    this.isUserOrBot = event.value
    if (this.isUserOrBot == 'User') {
      this.isBotAuthorized = false;
      this.trendAlgoStartingPoint = 0;
      this.tempTrendAlgoStartingPoint = 0;
      this.targetPrice = 0;
      this.stopLossPrice = 0
      this.tradeCurrentHigh = 0
      this.tradeInitialAverage = 0
      this.updateChartLines()
    }
  }
  updateChartLines() {
    this.stockChart.options.plugins.annotation.annotations.trendIndex.xMin = 0
    this.stockChart.options.plugins.annotation.annotations.trendIndex.xMax = 0
    this.stockChart.options.plugins.annotation.annotations.targetLine.yMin = 0
    this.stockChart.options.plugins.annotation.annotations.targetLine.yMax = 0
    this.stockChart.options.plugins.annotation.annotations.stopLossLine.yMin = 0
    this.stockChart.options.plugins.annotation.annotations.stopLossLine.yMax = 0
    this.stockChart.options.plugins.annotation.annotations.avgLine.yMin = 0
    this.stockChart.options.plugins.annotation.annotations.avgLine.yMax = 0
    this.stockChart.options.plugins.annotation.annotations.trendLine.xMin = 0
    this.stockChart.options.plugins.annotation.annotations.trendLine.xMax = 0
    this.stockChart.options.plugins.annotation.annotations.trendLine.yMin = 0
    this.stockChart.options.plugins.annotation.annotations.trendLine.yMax = 0
    this.stockChart.options.plugins.annotation.annotations.trendLineAbove.xMin = 0
    this.stockChart.options.plugins.annotation.annotations.trendLineAbove.xMax = 0
    this.stockChart.options.plugins.annotation.annotations.trendLineAbove.yMin = 0
    this.stockChart.options.plugins.annotation.annotations.trendLineAbove.yMax = 0
    this.stockChart.options.plugins.annotation.annotations.trendLineBelow.xMin = 0
    this.stockChart.options.plugins.annotation.annotations.trendLineBelow.xMax = 0
    this.stockChart.options.plugins.annotation.annotations.trendLineBelow.yMin = 0
    this.stockChart.options.plugins.annotation.annotations.trendLineBelow.yMax = 0
    this.stockChart.options.plugins.annotation.annotations.gutterLineAbove.xMin = 0
    this.stockChart.options.plugins.annotation.annotations.gutterLineAbove.xMax = 0
    this.stockChart.options.plugins.annotation.annotations.gutterLineAbove.yMin = 0
    this.stockChart.options.plugins.annotation.annotations.gutterLineAbove.yMax = 0
    this.stockChart.options.plugins.annotation.annotations.gutterLineBelow.xMin = 0
    this.stockChart.options.plugins.annotation.annotations.gutterLineBelow.xMax = 0
    this.stockChart.options.plugins.annotation.annotations.gutterLineBelow.yMin = 0
    this.stockChart.options.plugins.annotation.annotations.gutterLineBelow.yMax = 0
    this.stockChart.update()
  }
  onAlgoChanged(event: any) {
    this.tempSelectedAlgo = event.value
    this.isChangesToBot = true;
  }

  incomingTokensFromDB: any = []
  checkData(changes: any) {
    this.sharedCache.changeAccessToken(changes[0].accessToken)
    this.sharedCache.currentAccessToken.subscribe(token => this.accessToken = token!)
  }
  trendAlgoStartingPointChanged() {
    this.updateTrendIndexLine()
    this.isChangesToBot = true;
  }
  updatesToAlgo(){
    this.isChangesToBot = true
  }
  confirmAlgo() {
    this.isBotAuthorized = true;
    this.selectedAlgo = this.tempSelectedAlgo
    this.trendAlgoStartingPoint = this.tempTrendAlgoStartingPoint
    this.trendGutterFinal = this.trendGutterTemp
    this.stopLossLagFinal = this.stopLossLagTemp
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
  
  navToTestEnv() {
    this.router.navigate(['/testEnv'])
  }
  async onSelectedStockChange(event: any) {
    if (event.isUserInput == true) {
      this.isLoading = true;
      this.listOfAddedLines = []
      this.selectedStockName = event.source.value
      this.chartData.name = this.selectedStockName
      await this.getStockInfo()
      this.chartData = {
        history: [],
        labels: [],
        name: this.selectedStockName,
        time: [],
        volume: [],
        volumeTime: []
      }
      this.stockChart.data.datasets[0].label = this.selectedStockName
      await this.getStockData()
      this.isLoading = false;
    }

  }

  async getStockData() {
    this.chartInfo = await dbCurrentDayStockDataRepo.find({ where: { stockName: this.selectedStockName }, orderBy: { time: 'asc' } })
    this.chartData.name = this.selectedStockName
    for(let i = 0; i < this.chartInfo.length; i++){
      if(reusedFunctions.is830AMCT(this.chartInfo[i].time)){
        this.stockOpenPrice = this.chartInfo[i].stockPrice;
        break;
      }
    }
    this.getInitialVolumeData()
  }
  userLeaderBoard: any[] = []
  async getUserLeaderBoard(){
    let users = await userRepo.find()
    for(let i = 0; i < users.length; i++){
      let userSavings = await SimFinance.getSimFinDataByUser(users[i].userId)
      this.userLeaderBoard.push({
        userName: users[i].userName,
        spending: userSavings[0].spending
      })
    }
    this.userLeaderBoard.sort((a,b) => b.spending - a.spending)
  }
  async loadStockVariance(){
    let stockVarianceData = await dbStockBasicHistoryRepo.find({where: {stockName: this.selectedStockName}})
    let totalHigh = 0;
    let totalLow = 0;
    for(let i = 0; i < stockVarianceData.length; i++){
      totalHigh += ((stockVarianceData[i].high - stockVarianceData[i].open) / stockVarianceData[i].open)
      totalLow += ((stockVarianceData[i].low - stockVarianceData[i].open) / stockVarianceData[i].open)
    }
    this.stockVarianceHigh = totalHigh/stockVarianceData.length;
    this.stockVarianceLow = totalLow/stockVarianceData.length;
  }
  


  isLoading: boolean = false;
  async ngOnInit() {
    this.isLoading = true
    Chart.register(annotationPlugin);
    Chart.register(...registerables)
    let user = await remult.initUser()
    await AuthController.resetUser()
    await this.getUserFinanceData()
    //await this.getUserLeaderBoard()
    this.distinctAvailableStocks = (await dbCurrentDayStockDataRepo.groupBy({ group: ['stockName'], orderBy: { stockName: 'desc' } })).map(e => e.stockName)
    this.selectedStockName = this.distinctAvailableStocks[0]
    this.chartData.name = this.selectedStockName
    await this.getStockInfo()
    this.userData = await dbTokenRepo.findFirst({ userId: remult.user?.id }) as DbTOkens
    this.createOrUpdateChart()
    //this.createVolumeChart()
    await this.getStockData()
    await this.loadStockVariance()
    this.startWebsocket()
    

    this.isLoading = false;



  }

  ngOnDestroy() {
    this.endStream()
    //this.schwabWebsocket?.close()
  }

}
