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
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { DbCurrentDayStockData, dbCurrentDayStockDataRepo } from '../../shared/tasks/dbCurrentDayStockData';
import { MatSelectModule } from '@angular/material/select';
import { reusedFunctions } from '../services/reusedFunctions';
import { dbTokenRepo, DbTOkens } from '../../shared/tasks/dbTokens';
import { AuthController } from '../../shared/controllers/AuthController';
import { MatTableModule } from '@angular/material/table';
import { EpochToTimePipe } from "../services/epochToTimePipe.pipe";
import { userRepo } from '../../shared/tasks/Users';
import { dbStockBasicHistoryRepo } from '../../shared/tasks/dbStockBasicHistory';
import { AddGraphComponent } from "./add-graph/add-graph.component";
import { SchwabController } from '../../shared/controllers/SchwabController';
import { LineData, lineType } from '../Dtos/ServerAlgoDto';
import zoomPlugin from 'chartjs-plugin-zoom';


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
  stochChart: any
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

  displayedColumns: string[] = ["Trade", "Stock", "Shares", "Price", "Time"]

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
  addLineToGraph() {
    this.addLineDialogRef = this.dialog.open(this.addLineTemplate, {
      width: '400px',
      enterAnimationDuration: 0,
      exitAnimationDuration: 0
    });
    this.addLineDialogRef.afterClosed().subscribe(async (result: any) => {
      if (result.length > 0) {
        console.log(result)
        this.addNewLinesToGraph(result)
      }
      else if (this.stockChart.data.datasets.length > 1) {
        this.listOfAddedLines = []
        this.stockChart.data.datasets = [this.stockChart.data.datasets[0]]
        this.stockChart.update()
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
    this.stockHistoryData = await OrderController.getAllSharedOrders()
    this.selectedStockHistoryData = this.stockHistoryData.filter(e => e.stockName == this.selectedStockName)


    //below is most likely not the best wat to find the net but it'll work for now
    for (let i = 0; i < this.selectedStockHistoryData.length - 1; i++) {
      //need to find each pair of buy and sells
      if (this.selectedStockHistoryData[i].orderType == 'Sell' && this.selectedStockHistoryData[i + 1].orderType == 'Buy') {
        this.selectedStockTotalNet += ((this.selectedStockHistoryData[i].shareQty * this.selectedStockHistoryData[i].stockPrice) - (this.selectedStockHistoryData[i + 1].shareQty * this.selectedStockHistoryData[i + 1].stockPrice))
      }
    }

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
            "keys": "AAPL, MSFT, PLTR, AMD, TSLA, XOM,NVO, NEE, NVDA",
            "fields": "0,1,2,3,4,5,6,7,8,9,10,33"
          }
        }
      ]
    }
    this.schwabWebsocket.onopen = () => {
      this.schwabWebsocket!.send(JSON.stringify(loginMsg))
    }
    this.schwabWebsocket.onmessage = async (event) => {
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
                this.refreshData()

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
  getInitialVolumeData() {
    this.chartData.volume = []
    for (let i = 1; i < this.chartInfo.length; i++) {
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
  refreshData() {
    this.chartData.history = this.chartInfo.map(e => e.stockPrice)
    this.chartData.labels = this.chartInfo.map(e => new Date(e.time).toLocaleTimeString())
    this.chartData.time = this.chartInfo.map(e => e.time)
    this.selectedStockCurrent = this.chartData.history[this.chartData.history.length - 1]
    this.selectedStockHigh = Math.max(...this.chartData.history)
    this.selectedStockLow = Math.min(...this.chartData.history)
    this.stockVariance = (this.chartData.history[this.chartData.history.length - 1] - this.stockOpenPrice) / this.stockOpenPrice
    if (this.listOfAddedLines.length > 0) {
      this.refreshAddedLines()
    }
    //this.refreshStochData()

    this.updateChart()
  }
  refreshAddedLines() {
    for (let i = 0; i < this.listOfAddedLines.length; i++) {

      if (this.listOfAddedLines[i].lineType == 'SMA') {
        let addedData: LineData = { value: 0, time: 0 }
        addedData = {
          value: (this.listOfAddedLines[i].data[this.listOfAddedLines[i].data.length - 1].value! + this.chartInfo[this.chartInfo.length - 1].stockPrice) - this.listOfAddedLines[i].data[this.listOfAddedLines[i].data.length - this.listOfAddedLines[i].lineLength].value!,
          time: this.chartInfo[this.chartInfo.length - 1].time
        }
        this.listOfAddedLines[i].data.push(addedData)
      }
      else if (this.listOfAddedLines[i].lineType == 'EMA') {
        let addedData: LineData = { value: 0, time: 0 }
        let multiplyFactor = 2 / (this.listOfAddedLines[i].lineLength + 1)
        let newVal = (this.chartInfo[this.chartInfo.length - 1].stockPrice * multiplyFactor) + (this.listOfAddedLines[i].data[this.listOfAddedLines[i].data.length - 1].value! * (1 - multiplyFactor))
        addedData = {
          value: newVal,
          time: this.chartInfo[this.chartInfo.length - 1].time
        }
        this.listOfAddedLines[i].data.push(addedData)
      }
      else if (this.listOfAddedLines[i].lineType == 'Cumulative VWAP') {
        let newData: LineData[] = this.calculateCumulativeVWAP()
        this.listOfAddedLines[i].data = newData
      }
      else if (this.listOfAddedLines[i].lineType == 'Rolling VWAP') {
        let newData: LineData[] = this.calculateRollingVWAP(this.listOfAddedLines[i].lineLength)
        this.listOfAddedLines[i].data = newData
      }
      else if (this.listOfAddedLines[i].lineType == 'Cumulative SMA') {
        let newData: LineData[] = this.calculateCumulativeSMA()
        this.listOfAddedLines[i].data = newData
      }
      let selectedDataSet = this.stockChart.data.datasets.filter((e: { label: string; }) => e.label == this.listOfAddedLines[i].lineType + ' - ' + this.listOfAddedLines[i].lineLength.toString())[0]
      selectedDataSet.data = this.listOfAddedLines[i].data.map(e => e.value)
    }
  }
  refreshStochData() {
    if (this.chartData.history.length < 3600) {
      this.stochData.push({ value: null, time: this.chartData.time[this.chartData.time.length - 1] })
    }
    else {
      let newValue = (this.selectedStockCurrent - this.selectedStockLow) / (this.selectedStockHigh - this.selectedStockLow)
      this.stochData.push({ value: newValue * 100, time: this.chartData.time[this.chartData.time.length - 1] })
    }
    console.log(this.stochData)
    this.stochChart.data.datasets[0].data = [...this.stochData.map(e => e.value)]
    this.stochChart.data.labels = [...this.stochData.map(e => new Date(e.time).toLocaleTimeString())]
    this.stochChart.update()
  }
  submitFollowUp() {
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
  listOfBGCOlors: string[] = ['#1ca0de', '#eeb528', '#d82c2c']
  listOfAddedLines: lineType[] = []
  listOfSmaLines: any[] = []
  addNewLinesToGraph(listOfLines: lineType[]) {
    this.listOfAddedLines = []
    let newLines = [...listOfLines]
    this.stockChart.data.datasets = [this.stockChart.data.datasets[0]]
    for (let i = 0; i < newLines.length; i++) {
      let lineData: LineData[] = []

      if (newLines[i].lineType == 'SMA') {
        lineData = this.calculateSMA(newLines[i].lineLength)
      }
      else if (newLines[i].lineType == 'EMA') {
        lineData = this.calculateEMA(newLines[i].lineLength)
      }
      else if (newLines[i].lineType == 'Cumulative VWAP') {
        lineData = this.calculateCumulativeVWAP()
      }
      else if (newLines[i].lineType == 'Rolling VWAP') {
        lineData = this.calculateRollingVWAP(newLines[i].lineLength)
      }
      else if (newLines[i].lineType == 'Cumulative SMA') {
        lineData = this.calculateCumulativeSMA()
      }
      this.listOfAddedLines.push({ id: newLines[i].id, lineType: newLines[i].lineType, lineLength: newLines[i].lineLength, data: lineData })

      this.stockChart.data.datasets.push({
        label: newLines[i].lineType + ' - ' + newLines[i].lineLength.toString(),
        data: lineData.map(e => e.value),
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
  calculateSMA(lengthOfSma: number) {
    console.log('here 3')
    let returnArray: any[] = []
    let windowSum = 0
    for (let i = 0; i < lengthOfSma; i++) {
      windowSum += this.chartInfo[i].stockPrice
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.chartInfo[lengthOfSma - 1].stockPrice, avg: windowSum / lengthOfSma, date: new Date(this.chartInfo[lengthOfSma - 1].time).toLocaleTimeString() })
    for (let j = lengthOfSma; j < this.chartInfo.length; j++) {
      windowSum += this.chartInfo[j].stockPrice - this.chartInfo[j - lengthOfSma].stockPrice
      returnArray.push({ stockName: this.selectedStockName, close: this.chartInfo[j].stockPrice, avg: windowSum / lengthOfSma, date: new Date(this.chartInfo[j].time).toLocaleTimeString() })
    }
    console.log('here 4')
    return returnArray
  }
  calculateEMA(lineLength: number): LineData[] {
    let returnData: LineData[] = []
    let windowSum = 0
    for (let i = 0; i < lineLength - 1; i++) {
      returnData.push({ value: null, time: this.chartInfo[i].time })
      windowSum += this.chartInfo[i].stockPrice
    }
    windowSum += this.chartInfo[lineLength - 1].stockPrice
    returnData.push({ value: windowSum / lineLength, time: this.chartInfo[lineLength - 1].time })

    let multiplyFactor = 2 / (lineLength + 1)
    for (let i = lineLength; i < this.chartInfo.length; i++) {
      let newVal = (this.chartInfo[i].stockPrice * multiplyFactor) + (returnData[returnData.length - 1].value! * (1 - multiplyFactor))
      returnData.push({ value: newVal, time: this.chartInfo[i].time })
    }
    return returnData
  }
  calculateCumulativeVWAP(): LineData[] {
    let returnData: LineData[] = []
    let cumulativePV = 0;
    let cumulativeVolume = 0;
    for (let i = 0; i < this.chartInfo.length; i++) {
      cumulativePV += this.chartInfo[i].stockPrice * this.chartInfo[i].volume;
      cumulativeVolume += this.chartInfo[i].volume;
      const vwap = cumulativePV / cumulativeVolume;
      returnData.push({ value: vwap, time: this.chartInfo[i].time });
    }

    return returnData
  }
  calculateRollingVWAP(lineLength: number): LineData[] {
    let returnData: LineData[] = []
    let cumulativePV = 0;
    let cumulativeVolume = 0;
    for (let i = 0; i < lineLength - 1; i++) {
      cumulativePV += this.chartInfo[i].stockPrice * this.chartInfo[i].volume
      cumulativeVolume += this.chartInfo[i].volume
      returnData.push({ value: null, time: this.chartInfo[i].time })
    }
    returnData.push({ value: cumulativePV / cumulativeVolume, time: this.chartInfo[lineLength - 1].time });
    for (let i = lineLength; i < this.chartInfo.length; i++) {
      cumulativePV += (this.chartInfo[i].stockPrice * this.chartInfo[i].volume) - (this.chartInfo[i - lineLength].stockPrice * this.chartInfo[i - lineLength].volume);
      cumulativeVolume += this.chartInfo[i].volume - this.chartInfo[i - lineLength].volume;
      const vwap = cumulativePV / cumulativeVolume;
      returnData.push({ value: vwap, time: this.chartInfo[i].time });
    }

    return returnData
  }
  calculateCumulativeSMA() {
    let returnData: LineData[] = []
    let cumulativePrice: number = 0
    for (let i = 0; i < this.chartInfo.length; i++) {
      cumulativePrice += this.chartInfo[i].stockPrice
      returnData.push({ value: cumulativePrice / (i + 1), time: this.chartInfo[i].time })
    }
    return returnData
  }
  resetZoom() {
    this.stockChart.resetZoom()
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
          zoom: {
            pan: {
              enabled: true
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'xy',
            }
          },
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
  createStochChart() {
    console.log('create chart')
    this.stochChart = new Chart("stoch-chart", {
      type: 'line', //this denotes tha type of chart

      data: {// values on X-Axis

        labels: this.stochData.map(e => new Date(e.time).toLocaleTimeString()),

        datasets: [
          {
            label: 'Stoch',
            data: this.stochData.map(e => e.value),
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

        aspectRatio: 8,
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
            max: 100,
            min: 0,
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
  updatesToAlgo() {
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
      this.stockChart.data.datasets = [this.stockChart.data.datasets[0]]
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
    for (let i = 0; i < this.chartInfo.length; i++) {
      if (reusedFunctions.is830AMCT(this.chartInfo[i].time)) {
        this.stockOpenPrice = this.chartInfo[i].stockPrice;
        break;
      }
    }
    this.getInitalStochData()
    //this.getInitialVolumeData()
  }
  getInitalStochData() {
    this.stochData.length = 0
    let tradeHigh = 0
    let tradeLow = 1000000
    if (this.chartInfo.length < 3600) {
      for (let i = 0; i < this.chartInfo.length; i++) {
        this.stochData.push({ value: null, time: this.chartInfo[i].time })
      }
    }
    else {
      for (let i = 0; i < 3600; i++) {
        if (this.chartInfo[i].stockPrice > tradeHigh) {
          tradeHigh = this.chartInfo[i].stockPrice
        }
        if (this.chartInfo[i].stockPrice < tradeLow) {
          tradeLow = this.chartInfo[i].stockPrice
        }
        this.stochData.push({ value: null, time: this.chartInfo[i].time })
      }
      for (let i = 3600; i < this.chartInfo.length; i++) {
        if (this.chartInfo[i].stockPrice > tradeHigh) {
          tradeHigh = this.chartInfo[i].stockPrice
        }
        if (this.chartInfo[i].stockPrice < tradeLow) {
          tradeLow = this.chartInfo[i].stockPrice
        }
        let newValue = (this.chartInfo[i].stockPrice - tradeLow) / (tradeHigh - tradeLow)
        this.stochData.push({ value: newValue * 100, time: this.chartInfo[i].time })
      }
    }
    console.log(this.stochData)

  }
  userLeaderBoard: any[] = []
  async getUserLeaderBoard() {
    let users = await userRepo.find()
    for (let i = 0; i < users.length; i++) {
      let userSavings = await SimFinance.getSimFinDataByUser(users[i].userId)
      this.userLeaderBoard.push({
        userName: users[i].userName,
        spending: userSavings[0].spending
      })
    }
    this.userLeaderBoard.sort((a, b) => b.spending - a.spending)
  }
  async loadStockVariance() {
    let stockVarianceData = await dbStockBasicHistoryRepo.find({ where: { stockName: this.selectedStockName } })
    let totalHigh = 0;
    let totalLow = 0;
    for (let i = 0; i < stockVarianceData.length; i++) {
      totalHigh += ((stockVarianceData[i].high - stockVarianceData[i].open) / stockVarianceData[i].open)
      totalLow += ((stockVarianceData[i].low - stockVarianceData[i].open) / stockVarianceData[i].open)
    }
    this.stockVarianceHigh = totalHigh / stockVarianceData.length;
    this.stockVarianceLow = totalLow / stockVarianceData.length;
  }
  getDateTime(epoch: number): string {
    let dateTime = new Date(epoch).toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
    })
    return dateTime
  }

  stochData: any[] = []

  isLoading: boolean = false;
  async ngOnInit() {
    this.isLoading = true
    Chart.register(annotationPlugin);
    Chart.register(...registerables)
    Chart.register(zoomPlugin)
    let user = await remult.initUser()
    await AuthController.resetUser()
    let userTokenData = await dbTokenRepo.findFirst({ userId: user?.id }) as DbTOkens
    if (userTokenData.accountNum == '') {
      //let accountNum = await SchwabController.getAccountsCall(userTokenData.accessToken)
      //console.log(accountNum)
      //await dbTokenRepo.update(userTokenData.id!, {...userTokenData, accountNum: accountNum})
      //userTokenData = await dbTokenRepo.findFirst({userId: user?.id}) as DbTOkens
    }
    //let userAccountInfo = await getAccountInfo(userTokenData.accountNum, userTokenData.accessToken)

    this.distinctAvailableStocks = ['AAPL', 'MSFT', 'PLTR', 'AMD', 'TSLA', 'XOM', 'NVO', 'NEE', 'BAC', 'NVDA']
    this.selectedStockName = this.distinctAvailableStocks[0]
    this.chartData.name = this.selectedStockName
    await this.getStockInfo()
    this.userData = await dbTokenRepo.findFirst({ userId: remult.user?.id }) as DbTOkens
    this.createOrUpdateChart()
    //this.createStochChart()
    await this.getStockData()
    //await this.loadStockVariance()
    this.startWebsocket()


    this.isLoading = false;



  }

  ngOnDestroy() {
    this.endStream()
    //this.schwabWebsocket?.close()
  }

}
