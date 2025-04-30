import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DbAlgorithmList, dbAlgorithmListRepo } from '../../shared/tasks/dbAlgorithmList';
import { DbStockBasicHistory, dbStockBasicHistoryRepo } from '../../shared/tasks/dbStockBasicHistory';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { reusedFunctions } from '../services/reusedFunctions';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DbStockHistoryData, dbStockHistoryDataRepo } from '../../shared/tasks/dbStockHistoryData';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';



type serverAlgos = {
  name: string;
  isSelected: boolean;
}
type sma200Array = {
  stockName: string;
  close: number;
  avg: number;
  date: string;
}
type bufferAlgo = {
  buyBuffer: number;
  sellBuffer: number;
  checkBuffer: number;
  smaLong: number;
  smaMedium: number;
  smaShort: number;
  profit: number;
  stopLoss?: number;
  numberOfTrades: number;
  //listOfTrades: orderLocation[];
}
type orderLocation = {
  buySell: string;
  date: string;
  price: number;
}
@Component({
  selector: 'app-server-trade-screen',
  imports: [MatCheckboxModule, CommonModule, MatTableModule, MatProgressSpinnerModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatInputModule, FormsModule, MatSlideToggleModule],
  templateUrl: './server-trade-screen.component.html',
  styleUrl: './server-trade-screen.component.css'
})

export class ServerTradeScreenComponent implements OnInit {
  isLoading: boolean = false;
  listOfServerAlgos: serverAlgos[] = []
  userAlgos: DbAlgorithmList | undefined = undefined
  allHistory: DbStockBasicHistory[] = []
  selectedInterDayStockData: DbStockBasicHistory[] = []
  longSmaResults: sma200Array[] = []
  mediumSmaResults: sma200Array[] = []
  shortSmaResults: sma200Array[] = []
  selectedStockName: string = ''
  selectedStockLast200: sma200Array[] = []
  selectedStockLast40: sma200Array[] = []
  selectedStockLast5: sma200Array[] = []
  stockChart: any;
  rsiChart: any;
  distinctStocks: string[] = []
  annotationsArray: any[] = []
  intraDayChecked: boolean = false;
  distinctDates: string[] = []
  selectedDate: string = ''
  stockDataForSelectedDay: DbStockHistoryData[] = []
  listOfLastHour: sma200Array[] = []
  listOfLast30Minutes: sma200Array[] = []
  listOfLast5Minutes: sma200Array[] = []
  listOfLast2Minutes: sma200Array[] = []
  listOfLastMinute: sma200Array[] = []
  displayedColumns: string[] = ['Profit', 'NoTrades', 'BuyGutter', 'SellGutter', 'CheckGutter', 'smaLong', 'smaMedium', 'smaShort']
  intraDayLongSma: number = 0
  intraDayMediumSma: number = 0
  intraDayShortSma: number = 0

  interDayLongSma: number = 0;
  interDayMediumSma: number = 0
  interDayShortSma: number = 0
  stopLoss: number = 0


  async saveAlgos() {
    await dbAlgorithmListRepo.save({ ...this.userAlgos, sma200sma50: this.listOfServerAlgos[0].isSelected })
  }
  getStockDisplay() {
    this.selectedInterDayStockData = this.allHistory.filter(e => e.stockName == this.selectedStockName)
  }
  async onSelectedStockChange(event: any) {
    if (event.isUserInput == true) {
      this.selectedStockName = event.source.value
      if (!this.intraDayChecked) {
        this.isLoading = true
        this.intraDayLongSma = 3600;
        this.intraDayMediumSma = 1800;
        this.intraDayShortSma = 300
        this.selectedInterDayStockData = this.allHistory.filter(e => e.stockName = this.selectedStockName)
        this.calculateSmaValuesInterDaySingleRun()
        this.updateChart()
        this.runSimulation()
        this.isLoading = false
      }
      else {
        this.isLoading = true
        await this.getStockHistoricalData()
        await this.updateStockChartData(this.selectedDate)
        this.calculateIntraDaySma()
        this.updateChartIntraDay()
        this.runSimulationIntraDay()
        this.isLoading = false
      }


    }
  }




  createOrUpdateChart() {

    console.log('create chart')
    this.stockChart = new Chart("stock-chart", {
      type: 'line', //this denotes tha type of chart

      data: {// values on X-Axis

        labels: this.longSmaResults.map(e => e.date),

        datasets: [
          {
            label: 'Actual',
            data: this.longSmaResults.map(e => e.close),
            backgroundColor: '#54C964',
            hoverBackgroundColor: '#54C964',
            borderColor: '#54C964',
            pointBackgroundColor: '#54C964',
            pointBorderColor: '#54C964',
            pointRadius: 0,
            spanGaps: true
          },
          {
            label: '200',
            data: this.longSmaResults.map(e => e.avg),
            backgroundColor: '#d82c2c',
            hoverBackgroundColor: '#d82c2c',
            borderColor: '#d82c2c',
            pointBackgroundColor: '#d82c2c',
            pointBorderColor: '#d82c2c',
            pointRadius: 0,
            spanGaps: true
          },
          {
            label: '40',
            data: this.mediumSmaResults.map(e => e.avg),
            backgroundColor: '#eeb528',
            hoverBackgroundColor: '#eeb528',
            borderColor: '#eeb528',
            pointBackgroundColor: '#eeb528',
            pointBorderColor: '#eeb528',
            pointRadius: 0,
            spanGaps: true
          }
          ,
          {
            label: '5',
            data: this.shortSmaResults.map(e => e.avg),
            backgroundColor: '#1ca0de',
            hoverBackgroundColor: '#1ca0de',
            borderColor: '#1ca0de',
            pointBackgroundColor: '#1ca0de',
            pointBorderColor: '#1ca0de',
            pointRadius: 0,
            spanGaps: true
          }
        ]
      },
      options: {

        aspectRatio: 2.5,
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
            max: this.getMaxForChart(this.longSmaResults),
            min: this.getMinForChart(this.longSmaResults),
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
            annotations: this.annotationsArray

          }
        }
      }
    })


  }

  getMaxForChart(arr: sma200Array[]): number {
    let max = -1000000000
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].close > max) {
        max = arr[i].close
      }
    }
    return max + 2

  }
  getMinForChart(arr: sma200Array[]): number {
    let min = 1000000000
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].close < min) {
        min = arr[i].close
      }
    }
    return min - 2

  }
  createOrUpdateRsiChart() {

    console.log('create chart')
    this.rsiChart = new Chart("rsi-chart", {
      type: 'line', //this denotes tha type of chart

      data: {// values on X-Axis

        labels: this.rsiData.map(e => e.date),

        datasets: [
          {
            label: 'Actual',
            data: this.rsiData.map(e => e.rsiNum),
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

        aspectRatio: 2.5,
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

  buyGutter: number = .05;
  sellGutter: number = .15;
  check200Gutter: number = .1;



  totalProfit: number = 0;



  /* Buttons */

  async changeDayType() {
    this.topAlgos = []
    if (this.intraDayChecked) {
      this.isLoading = true
      this.buyGutter = .001
      this.sellGutter = .001
      this.check200Gutter = .01
      this.intraDayLongSma = 3600;
      this.intraDayMediumSma = 1800;
      this.intraDayShortSma = 300
      await this.updateStockChartData(this.selectedDate)
      this.calculateIntraDaySma()
      this.updateChartIntraDay()
      this.runSimulationIntraDay()
      this.calcualateIntraDayRsi()
      this.isLoading = false
    }
    else {
      this.isLoading = true
      this.buyGutter = .05
      this.sellGutter = .01
      this.check200Gutter = .1
      this.calculateSmaValuesInterDaySingleRun()
      this.updateChart()
      this.runSimulation()
      this.isLoading = false
    }
  }
  onRunSimulationNew(){
    if (this.intraDayChecked) {
      this.isLoading = true
      this.runSimulationIntraDayNew()
      this.isLoading = false
    }
    else {
      //this.isLoading = true
      //this.runSimulation()
      //this.isLoading = false
    }
  }
  onRunSimulation() {
    if (this.intraDayChecked) {
      this.isLoading = true
      this.runSimulationIntraDay()
      this.isLoading = false
    }
    else {
      this.isLoading = true
      this.runSimulation()
      this.isLoading = false
    }
  }
  async onRunEntireSimulationIntraDayAllDays() {
    this.isLoading = true;
    //await this.runEntireSimulationIntraDayAllDays()
    this.isLoading = false
  }
  /* Intra Day */
  async onSelectedDateChange(event: any) {
    if (event.isUserInput == true) {
      this.isLoading = true
      this.selectedDate = event.source.value
      await this.updateStockChartData(this.selectedDate)
      this.calculateIntraDaySma()
      this.updateChartIntraDay()
      this.runSimulationIntraDay()
      this.topAlgos = []
      this.isLoading = false
    }
  }
  async getStockHistoricalData() {
    this.distinctDates = (await dbStockHistoryDataRepo.groupBy({ where: { stockName: this.selectedStockName }, group: ['date'], orderBy: { date: 'desc' } })).map(e => e.date)
    this.selectedDate = this.distinctDates[0]
  }
  async updateStockChartData(selectedDate: string) {
    this.stockDataForSelectedDay = await dbStockHistoryDataRepo.find({ where: { stockName: this.selectedStockName, date: selectedDate }, orderBy: { time: 'asc' } })
    this.stockDataForSelectedDay = this.stockDataForSelectedDay.filter(e => reusedFunctions.isWithinTradingHoursLocal(e.time))
  }
  async updateStockChartDataNew(selectedDate: string): Promise<DbStockHistoryData[]> {
    let returnData = await dbStockHistoryDataRepo.find({ where: { stockName: this.selectedStockName, date: selectedDate }, orderBy: { time: 'asc' } })
    returnData = returnData.filter(e => reusedFunctions.isWithinTradingHoursLocal(e.time))
    return returnData
  }
  calculateIntraDaySma() {
    this.listOfLastHour.length = 0
    this.listOfLast30Minutes.length = 0
    this.listOfLast5Minutes.length = 0
    this.listOfLast2Minutes.length = 0
    this.listOfLastMinute.length = 0

    let windowSum = 0

    for (let i = 0; i < this.intraDayLongSma; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    this.listOfLastHour.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma - 1].stockPrice, avg: windowSum / this.intraDayLongSma, date: new Date(this.stockDataForSelectedDay[this.intraDayLongSma - 1].time).toLocaleTimeString() })
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      windowSum += this.stockDataForSelectedDay[j].stockPrice - this.stockDataForSelectedDay[j - this.intraDayLongSma].stockPrice
      this.listOfLastHour.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: windowSum / this.intraDayLongSma, date: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }

    windowSum = 0

    for (let i = this.intraDayLongSma - this.intraDayMediumSma; i < this.intraDayLongSma; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    this.listOfLast30Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma - 1].stockPrice, avg: windowSum / this.intraDayMediumSma, date: new Date(this.stockDataForSelectedDay[this.intraDayLongSma - 1].time).toLocaleTimeString() })
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      windowSum += this.stockDataForSelectedDay[j].stockPrice - this.stockDataForSelectedDay[j - this.intraDayMediumSma].stockPrice
      this.listOfLast30Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: windowSum / this.intraDayMediumSma, date: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }

    windowSum = 0

    for (let i = this.intraDayLongSma - this.intraDayShortSma; i < this.intraDayLongSma; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    this.listOfLast5Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma - 1].stockPrice, avg: windowSum / this.intraDayShortSma, date: new Date(this.stockDataForSelectedDay[this.intraDayLongSma - 1].time).toLocaleTimeString() })
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      windowSum += this.stockDataForSelectedDay[j].stockPrice - this.stockDataForSelectedDay[j - this.intraDayShortSma].stockPrice
      this.listOfLast5Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: windowSum / this.intraDayShortSma, date: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }

    windowSum = 0

    for (let i = this.intraDayLongSma - 120; i < this.intraDayLongSma; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    this.listOfLast2Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma - 1].stockPrice, avg: windowSum / 120, date: new Date(this.stockDataForSelectedDay[this.intraDayLongSma - 1].time).toLocaleTimeString() })
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      windowSum += this.stockDataForSelectedDay[j].stockPrice - this.stockDataForSelectedDay[j - 120].stockPrice
      this.listOfLast2Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: windowSum / 120, date: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }

    windowSum = 0

    for (let i = this.intraDayLongSma - 60; i < this.intraDayLongSma; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    this.listOfLastMinute.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma - 1].stockPrice, avg: windowSum / 60, date: new Date(this.stockDataForSelectedDay[this.intraDayLongSma - 1].time).toLocaleTimeString() })
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      windowSum += this.stockDataForSelectedDay[j].stockPrice - this.stockDataForSelectedDay[j - 60].stockPrice
      this.listOfLastMinute.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: windowSum / 60, date: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }
  }


  calculateIntraDayLongSma(longValue: number): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = 0; i < longValue; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[longValue - 1].stockPrice, avg: (windowSum / longValue), date: new Date(this.stockDataForSelectedDay[longValue - 1].time).toLocaleTimeString() });

    for (let i = longValue; i < this.stockDataForSelectedDay.length; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - longValue].stockPrice;
      returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: (windowSum / longValue), date: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() });
    }
    return returnArray

  }
  calculateIntraDayShortSmaAllDays(longValue: number, shortValue: number, selectedStockData: DbStockHistoryData[]) {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = longValue - shortValue; i < longValue; i++) {
      windowSum += selectedStockData[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[longValue - 1].stockPrice, avg: (windowSum / shortValue), date: new Date(selectedStockData[longValue - 1].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < selectedStockData.length; i++) {
      windowSum += selectedStockData[i].stockPrice - selectedStockData[i - shortValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[i].stockPrice, avg: (windowSum / shortValue), date: new Date(selectedStockData[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  calculateIntraDayMediumSmaAllDays(longValue: number, mediumValue: number, selectedStockData: DbStockHistoryData[]) {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = longValue - mediumValue; i < longValue; i++) {
      windowSum += selectedStockData[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[longValue].stockPrice, avg: (windowSum / mediumValue), date: new Date(selectedStockData[longValue].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < selectedStockData.length; i++) {
      windowSum += selectedStockData[i].stockPrice - selectedStockData[i - mediumValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[i].stockPrice, avg: (windowSum / mediumValue), date: new Date(selectedStockData[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  calculateIntraDayLongSmaAllDays(longValue: number, selectedStockData: DbStockHistoryData[]): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = 0; i < longValue; i++) {
      windowSum += selectedStockData[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[longValue].stockPrice, avg: (windowSum / longValue), date: new Date(selectedStockData[longValue].time).toLocaleTimeString() });

    for (let i = longValue; i < selectedStockData.length; i++) {
      windowSum += selectedStockData[i].stockPrice - selectedStockData[i - longValue].stockPrice;
      returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[i].stockPrice, avg: (windowSum / longValue), date: new Date(selectedStockData[i].time).toLocaleTimeString() });
    }
    return returnArray
  }
  calculateIntraDayMediumSmaNew(longValue: number, mediumValue: number): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0
    for (let i = longValue - mediumValue; i < longValue; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[longValue - 1].stockPrice, avg: (windowSum / mediumValue), date: new Date(this.stockDataForSelectedDay[longValue - 1].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < this.stockDataForSelectedDay.length; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - mediumValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: (windowSum / mediumValue), date: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  calculateIntraDayShortSmaNew(longValue: number, shortValue: number): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0
    for (let i = longValue - shortValue; i < longValue; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[longValue - 1].stockPrice, avg: (windowSum / shortValue), date: new Date(this.stockDataForSelectedDay[longValue - 1].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < this.stockDataForSelectedDay.length; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - shortValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: (windowSum / shortValue), date: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  updateChartIntraDay() {
    this.stockChart.data.datasets[0].data = this.listOfLastHour.map(e => e.close)
    this.stockChart.data.datasets[0].label = 'Actual'
    this.stockChart.data.datasets[1].data = this.listOfLastHour.map(e => e.avg)
    this.stockChart.data.datasets[1].label = (this.intraDayLongSma / 60) + " minutes"
    this.stockChart.data.datasets[2].data = this.listOfLast30Minutes.map(e => e.avg)
    this.stockChart.data.datasets[2].label = (this.intraDayMediumSma / 60) + " minutes"
    this.stockChart.data.datasets[3].data = this.listOfLast5Minutes.map(e => e.avg)
    this.stockChart.data.datasets[3].label = (this.intraDayShortSma / 60) + " minutes"
    this.stockChart.data.labels = this.listOfLastHour.map(e => e.date)
    this.stockChart.options.scales.y.max = this.getMaxForChart(this.listOfLastHour)
    this.stockChart.options.scales.y.min = this.getMinForChart(this.listOfLastHour)
    this.stockChart.update()
  }
  listOfProfits: bufferAlgo[] = []
  topAlgos: bufferAlgo[] = []
  runSimulationIntraDay() {
    this.calculateIntraDaySma()
    this.updateChartIntraDay()
    let result = this.calculateBuyAndSellPointsIntraDaySellAtEnd(this.listOfLastHour, this.listOfLast30Minutes, this.listOfLast5Minutes, this.listOfLast2Minutes, this.buyGutter, this.sellGutter, this.check200Gutter)
    this.updateGraphBuyAndSellPointsIntraDayNew(result.orderLocations)
    this.totalProfit = result.profit
  }
  runSimulationIntraDayNew(){
    this.calculateIntraDaySma()
    this.updateChartIntraDay()
    let result = this.calculateBuyAndSellPointsIntraDaySellAtEndNew(this.listOfLastHour, this.listOfLast30Minutes, this.listOfLast5Minutes, this.listOfLast2Minutes, this.listOfLastMinute, this.buyGutter, this.sellGutter, this.check200Gutter)
    this.updateGraphBuyAndSellPointsIntraDayNew(result.orderLocations)
    this.totalProfit = result.profit
  }
  onRunEntireSimulation() {
    this.isLoading = true;
    if (this.intraDayChecked) {
      //this.runEntireSimulationIntraDay()
    }
    else {
      //this.runEntireSimulationInterDay()
    }

    this.isLoading = false
  }


  /* runEntireSimulationIntraDay() {
    let listOfProfits = []
    let mapOfLongSmaValues = new Map<number, sma200Array[]>()
    let mapOfMediumSmaValues = new Map<string, sma200Array[]>()
    let mapOfShortSmaValues = new Map<string, sma200Array[]>()
    for (let f = .15; f <= .5; f += .05) {
      for (let i = 1; i <= 20; i++) {
        for (let j = 1; j <= 20; j++) {
          console.time('sell')
          for (let k = 1; k <= 30; k++) {
            for (let m = 60; m <= 90; m += 5) {
              let longSmaResult = mapOfLongSmaValues.get(m * 60)
              if (longSmaResult === undefined) {
                longSmaResult = this.calculateIntraDayLongSma(m * 60)
                mapOfLongSmaValues.set(
                  m * 60,
                  longSmaResult
                )
              }

              for (let n = 20; n <= 40; n += 5) {
                let mediumSmaResult = mapOfMediumSmaValues.get(JSON.stringify({ long: m * 60, value: n * 60 }))
                if (mediumSmaResult === undefined) {
                  mediumSmaResult = this.calculateIntraDayMediumSmaNew(m * 60, n * 60)
                  mapOfMediumSmaValues.set(
                    JSON.stringify({ long: m * 60, value: n * 60 }),
                    mediumSmaResult
                  )
                }
                for (let p = 1; p <= 10; p++) {
                  let shortSmaResult = mapOfShortSmaValues.get(JSON.stringify({ long: m * 60, value: p * 60 }))
                  if (shortSmaResult === undefined) {
                    shortSmaResult = this.calculateIntraDayShortSmaNew(m * 60, p * 60)
                    mapOfShortSmaValues.set(
                      JSON.stringify({ long: m * 60, value: p * 60 }),
                      shortSmaResult
                    )
                  }
                  let result = this.calculateBuyAndSellPointsIntraDaySellAtEnd(longSmaResult!, mediumSmaResult!, shortSmaResult!, Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3)))


                  if (listOfProfits.length < 5) {
                    listOfProfits.push({
                      buyBuffer: Number((i * .001).toPrecision(3)),
                      sellBuffer: Number((j * .001).toPrecision(3)),
                      checkBuffer: Number((k * .001).toPrecision(3)),
                      smaLong: m * 60,
                      smaMedium: n * 60,
                      smaShort: p * 60,
                      profit: result.profit,
                      stopLoss: f,
                      numberOfTrades: result.orderLocations.length
                    })
                    listOfProfits.sort((a, b) => b.profit - a.profit)
                  }
                  else if (result.profit > listOfProfits[4].profit) {
                    listOfProfits[4] = {
                      buyBuffer: Number((i * .001).toPrecision(3)),
                      sellBuffer: Number((j * .001).toPrecision(3)),
                      checkBuffer: Number((k * .001).toPrecision(3)),
                      smaLong: m * 60,
                      smaMedium: n * 60,
                      smaShort: p * 60,
                      profit: result.profit,
                      stopLoss: f,
                      numberOfTrades: result.orderLocations.length
                    }
                    listOfProfits.sort((a, b) => b.profit - a.profit)

                  }

                }
              }

            }

          }
          console.timeEnd('sell')
        }
        console.log('finished outer loop iteration')
      }
    }
    console.log(listOfProfits.length)
    this.topAlgos = listOfProfits
    this.buyGutter = this.topAlgos[0].buyBuffer
    this.sellGutter = this.topAlgos[0].sellBuffer
    this.check200Gutter = this.topAlgos[0].checkBuffer
    this.intraDayLongSma = this.topAlgos[0].smaLong
    this.intraDayMediumSma = this.topAlgos[0].smaMedium
    this.intraDayShortSma = this.topAlgos[0].smaShort
    this.stopLoss = this.topAlgos[0].stopLoss!
    this.runSimulationIntraDay()

  } */




  /* async runEntireSimulationIntraDayAllDays() {
    let listOfProfits = []
    console.log(this.distinctDates)
    for (let h = 0; h < this.distinctDates.length; h++) {
      let selectedDate = this.distinctDates[h]
      this.stockDataForSelectedDay = await this.updateStockChartDataNew(selectedDate)
      let mapOfLongSmaValues = new Map<number, sma200Array[]>()
      let mapOfMediumSmaValues = new Map<number, sma200Array[]>()
      let mapOfShortSmaValues = new Map<number, sma200Array[]>()
      for (let i = 1; i <= 20; i++) {
        for (let j = 1; j <= 20; j++) {
          console.time('sell')
          for (let k = 1; k <= 30; k++) {
            for (let m = 60; m <= 90; m += 5) {
              let longSmaResult = mapOfLongSmaValues.get(m * 60)
              if (longSmaResult === undefined) {
                longSmaResult = this.calculateIntraDayLongSma(m * 60)
                mapOfLongSmaValues.set(
                  m * 60,
                  longSmaResult
                )
              }
              for (let n = 20; n <= 40; n += 5) {
                let mediumSmaResult = mapOfMediumSmaValues.get(n * 60)
                if (mediumSmaResult === undefined) {
                  mediumSmaResult = this.calculateIntraDayMediumSmaNew(m * 60, n * 60)
                  mapOfMediumSmaValues.set(
                    n * 60,
                    mediumSmaResult
                  )
                }
                for (let p = 1; p <= 10; p++) {
                  let shortSmaResult = mapOfShortSmaValues.get(p * 60)
                  if (shortSmaResult === undefined) {
                    shortSmaResult = this.calculateIntraDayShortSmaNew(m * 60, p * 60)
                    mapOfShortSmaValues.set(
                      p * 60,
                      shortSmaResult
                    )
                  }
                  let result = this.calculateBuyAndSellPointsIntraDaySellAtEnd(longSmaResult!, mediumSmaResult!, shortSmaResult!, Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3)))


                  listOfProfits.push({
                    buyBuffer: Number((i * .001).toPrecision(3)),
                    sellBuffer: Number((j * .001).toPrecision(3)),
                    checkBuffer: Number((k * .001).toPrecision(3)),
                    smaLong: m * 60,
                    smaMedium: n * 60,
                    smaShort: p * 60,
                    profit: result.profit,
                    numberOfTrades: result.orderLocations.length
                  })
                }
              }

            }

          }
          console.timeEnd('sell')
        }
        console.log('finished outer loop iteration')
      }
      console.log('finsihed: ' + selectedDate)
    }
    let topAverages: any[] = []
    for (let i = 0; i < 4200000; i++) {
      let filteredData = []
      filteredData.push(listOfProfits[i])
      for (let j = 1; j < this.distinctDates.length; j++) {
        filteredData.push(listOfProfits[i + (j * 4200000)])
      }
      let averageProfit = filteredData.reduce((sum, val) => sum + val.profit, 0) / filteredData.length
      let averageNumTrades = filteredData.reduce((sum, val) => sum + val.numberOfTrades, 0) / filteredData.length
      if (topAverages.length < 5) {
        topAverages.push({
          buyBuffer: filteredData[0].buyBuffer,
          sellBuffer: filteredData[0].sellBuffer,
          checkBuffer: filteredData[0].checkBuffer,
          smaLong: filteredData[0].smaLong,
          smaMedium: filteredData[0].smaMedium,
          smaShort: filteredData[0].smaShort,
          profit: averageProfit,
          numberOfTrades: averageNumTrades
        })
        topAverages.sort((a, b) => b.profit - a.profit)
      }
      else if (averageProfit > topAverages[4].profit) {
        topAverages[4] = {
          buyBuffer: filteredData[0].buyBuffer,
          sellBuffer: filteredData[0].sellBuffer,
          checkBuffer: filteredData[0].checkBuffer,
          smaLong: filteredData[0].smaLong,
          smaMedium: filteredData[0].smaMedium,
          smaShort: filteredData[0].smaShort,
          profit: averageProfit,
          numberOfTrades: averageNumTrades
        }
        topAverages.sort((a, b) => b.profit - a.profit)
      }
    }
    console.log(topAverages)
    this.topAlgos = topAverages
    this.buyGutter = this.topAlgos[0].buyBuffer
    this.sellGutter = this.topAlgos[0].sellBuffer
    this.check200Gutter = this.topAlgos[0].checkBuffer
    this.intraDayLongSma = this.topAlgos[0].smaLong
    this.intraDayMediumSma = this.topAlgos[0].smaMedium
    this.intraDayShortSma = this.topAlgos[0].smaShort
    this.runSimulationIntraDay()
  } */

  
  calculateBuyAndSellPointsIntraDaySellAtEndNew(longArray: sma200Array[], mediumArray: sma200Array[], shortArray: sma200Array[], shortArraySell: sma200Array[], shortArrayBuy: sma200Array[], buyGutter: number, sellGutter: number, checkGutter: number) {
    let buyOrSell = 'Buy'
    let orderLocations: orderLocation[] = []
    let profit = 0
    let longArrayLen = longArray.length
    let stopLoss = 0;
    let stopLossThreshold = 0
    let tradeHigh = 0
    let canTrade = true
    console.log(longArray)
    console.log(shortArraySell)
    for (let i = 0; i < longArrayLen; i++) {
      if(canTrade == false){
        if((new Date(shortArray[i].date).getTime() - new Date(orderLocations[orderLocations.length - 1].date).getTime()) > 1800000){
          canTrade = true
        }
      }
      if(canTrade && buyOrSell == 'Buy'){
        if (canTrade && buyOrSell == 'Buy' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) < (buyGutter * -1)) && (((shortArray[i].avg - longArray[i].avg) / longArray[i].avg) < checkGutter) && (shortArrayBuy[i].avg > shortArray[i].avg)) {
          orderLocations.push({ buySell: 'Buy', date: shortArray[i].date, price: shortArray[i].close })
          stopLoss = shortArray[i].close - (shortArray[i].close * .002)
          stopLossThreshold = shortArray[i].close + (shortArray[i].close * .001)
          tradeHigh = shortArray[i].close
          buyOrSell = 'Sell'
        }
      }
      else if(canTrade && buyOrSell == 'Sell'){
        if ((((shortArraySell[i].avg - mediumArray[i].avg) / mediumArray[i].avg) > sellGutter) && shortArraySell[i].close > orderLocations[orderLocations.length - 1].price) {
          orderLocations.push({ buySell: 'Sell', date: shortArraySell[i].date, price: shortArraySell[i].close })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
          buyOrSell = 'Buy'
        }
        else if(shortArraySell[i].close <= stopLoss){
          orderLocations.push({ buySell: 'Sell', date: shortArraySell[i].date, price: shortArraySell[i].close })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
          canTrade = false;
          buyOrSell = 'Buy'
        }
        else if (i == longArrayLen - 1) {
          orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
        }
        else if((shortArray[i].close >= stopLossThreshold) && stopLoss < orderLocations[orderLocations.length - 1].price){
          stopLoss = orderLocations[orderLocations.length - 1].price
        }
        else if((shortArray[i].close >= stopLossThreshold) && stopLoss >= orderLocations[orderLocations.length - 1].price){
          stopLoss += shortArray[i].close - tradeHigh
        }
        if(shortArray[i].close > tradeHigh){
          tradeHigh = shortArray[i].close
        }
      }
       
      
    }
    return { orderLocations: orderLocations, profit: profit }
  }


  calculateBuyAndSellPointsIntraDaySellAtEnd(longArray: sma200Array[], mediumArray: sma200Array[], shortArray: sma200Array[], shortArraySell: sma200Array[], buyGutter: number, sellGutter: number, checkGutter: number) {
    let buyOrSell = 'Buy'
    let orderLocations: orderLocation[] = []
    let profit = 0
    let longArrayLen = longArray.length
    let stopLoss = 0;
    let stopLossThreshold = 0
    let tradeHigh = 0
    let canTrade: boolean = true;
    console.log(longArray)
    console.log(shortArraySell)
    for (let i = 0; i < longArrayLen; i++) {
      if(canTrade == false){
        if((new Date(shortArray[i].date).getTime() - new Date(orderLocations[orderLocations.length - 1].date).getTime()) > 1800000){
          canTrade = true
        }
      }
      if(canTrade && buyOrSell == 'Buy'){
        if ((((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) < (buyGutter * -1)) && (((shortArray[i].avg - longArray[i].avg) / longArray[i].avg) < checkGutter)) {
          orderLocations.push({ buySell: 'Buy', date: shortArray[i].date, price: shortArray[i].close })
          stopLoss = shortArray[i].close - (shortArray[i].close * .002)
          stopLossThreshold = shortArray[i].close + (shortArray[i].close * .001)
          tradeHigh = shortArray[i].close
          buyOrSell = 'Sell'
        }
      }
      else if(canTrade && buyOrSell == 'Sell'){
        if (buyOrSell == 'Sell' && (((shortArraySell[i].avg - mediumArray[i].avg) / mediumArray[i].avg) > sellGutter) && shortArray[i].close > orderLocations[orderLocations.length - 1].price) {
          orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
          buyOrSell = 'Buy'
        }
        else if(buyOrSell == 'Sell' && shortArray[i].close <= stopLoss){
          orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
          buyOrSell = 'Buy'
          canTrade = false
        }
        else if (buyOrSell == 'Sell' && i == longArrayLen - 1) {
          orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
        }
        else if(buyOrSell == 'Sell' && (shortArray[i].close >= stopLossThreshold) && stopLoss < orderLocations[orderLocations.length - 1].price){
          stopLoss = orderLocations[orderLocations.length - 1].price
        }
        else if(buyOrSell == 'Sell' && (shortArray[i].close >= stopLossThreshold) && stopLoss >= orderLocations[orderLocations.length - 1].price){
          stopLoss += shortArray[i].close - tradeHigh
        }
        if(shortArray[i].close > tradeHigh){
          tradeHigh = shortArray[i].close
        }
      }
    }
    return { orderLocations: orderLocations, profit: profit }
  }
  updateGraphBuyAndSellPointsIntraDayNew(orderLocations: orderLocation[]) {
    console.log(orderLocations)
    this.annotationsArray = []
    for (let i = 0; i < orderLocations.length; i++) {
      this.annotationsArray.push({
        type: 'line',
        //display: this.selectedStockHistoryData.length > 0,

        xMin: this.listOfLastHour.findIndex(x => x.date == orderLocations[i].date),
        xMax: this.listOfLastHour.findIndex(x => x.date == orderLocations[i].date),
        borderColor: '#7874ff',
        borderWidth: 2,
        label: {
          display: true,
          content: orderLocations[i].buySell + ': ' + orderLocations[i].price,
          position: 'end'
        }
      })
    }
    this.stockChart.options.plugins.annotation.annotations = this.annotationsArray
    this.stockChart.update()
  }


  /* Inter Day */
  runSimulation() {
    this.calculateSmaValuesInterDaySingleRun()
    this.updateChart()
    let result = this.calculateBuyAndSellPointsInterDay()
    this.updateGraphBuyAndSellPoints(result.orderLocations)
    this.totalProfit = result.profit
  }
  runEntireSimulationInterDay() {
    let listOfProfits = []
    let mapOfLongSmaValues = new Map<number, sma200Array[]>()
    let mapOfMediumSmaValues = new Map<string, sma200Array[]>()
    let mapOfShortSmaValues = new Map<string, sma200Array[]>()
    for (let i = 1; i < 200; i++) {
      for (let j = 1; j < 200; j++) {
        for (let k = 1; k < 200; k++) {
          for (let m = 150; m <= 250; m += 5) {
            let longSmaResult = mapOfLongSmaValues.get(m)
            if (longSmaResult === undefined) {
              longSmaResult = this.calculateInterDayLongSma(m)
              mapOfLongSmaValues.set(
                m,
                longSmaResult
              )
            }
            for (let n = 20; n <= 50; n += 5) {
              let mediumSmaResult = mapOfMediumSmaValues.get(JSON.stringify({ long: m, value: n }))
              if (mediumSmaResult === undefined) {
                mediumSmaResult = this.calculateInterDayMediumSma(m, n)
                mapOfMediumSmaValues.set(
                  JSON.stringify({ long: m, value: n }),
                  mediumSmaResult
                )
              }
              for (let p = 1; p <= 15; p++) {
                let shortSmaResult = mapOfShortSmaValues.get(JSON.stringify({ long: m, value: p }))
                if (shortSmaResult === undefined) {
                  shortSmaResult = this.calculateInterDayShortSma(m, p)
                  mapOfShortSmaValues.set(
                    JSON.stringify({ long: m, value: p }),
                    shortSmaResult
                  )
                }


                let result = this.calculateInterDayBuyAndSellPointsEntireSim(longSmaResult!, mediumSmaResult!, shortSmaResult!, Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3)))
                let orderLocations = result.orderLocations
                let profit = result.profit

                if (listOfProfits.length < 5) {
                  listOfProfits.push({
                    buyBuffer: Number((i * .001).toPrecision(3)),
                    sellBuffer: Number((j * .001).toPrecision(3)),
                    checkBuffer: Number((k * .001).toPrecision(3)),
                    smaLong: m,
                    smaMedium: n,
                    smaShort: p,
                    profit: profit,
                    numberOfTrades: orderLocations.length
                  })
                  listOfProfits.sort((a, b) => b.profit - a.profit)
                }
                else if (profit > listOfProfits[4].profit) {
                  listOfProfits[4] = {
                    buyBuffer: Number((i * .001).toPrecision(3)),
                    sellBuffer: Number((j * .001).toPrecision(3)),
                    checkBuffer: Number((k * .001).toPrecision(3)),
                    smaLong: m,
                    smaMedium: n,
                    smaShort: p,
                    profit: profit,
                    numberOfTrades: orderLocations.length
                  }
                  listOfProfits.sort((a, b) => b.profit - a.profit)
                }

              }
            }
          }
        }
      }
      console.log('outer loop')
    }
    this.topAlgos = listOfProfits
    console.log(this.topAlgos)
    this.buyGutter = this.topAlgos[0].buyBuffer
    this.sellGutter = this.topAlgos[0].sellBuffer
    this.check200Gutter = this.topAlgos[0].checkBuffer
    this.interDayLongSma = this.topAlgos[0].smaLong
    this.interDayMediumSma = this.topAlgos[0].smaMedium
    this.interDayShortSma = this.topAlgos[0].smaShort
    this.runSimulation()
  }

  calculateInterDayBuyAndSellPointsEntireSim(longArray: sma200Array[], mediumArray: sma200Array[], shortArray: sma200Array[], buyGutter: number, sellGutter: number, checkGutter: number) {
    let buyOrSell = 'Buy'
    let orderLocations: orderLocation[] = []
    let longArrayLen = longArray.length
    let profit = 0
    for (let i = 0; i < longArrayLen; i++) {
      if (buyOrSell == 'Buy' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) < (buyGutter * -1)) && (((shortArray[i].avg - longArray[i].avg) / longArray[i].avg) < checkGutter)) {
        orderLocations.push({ buySell: 'Buy', date: shortArray[i].date, price: shortArray[i].close })
        buyOrSell = 'Sell'
      }
      else if (buyOrSell == 'Sell' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) > sellGutter) && shortArray[i].close > orderLocations[orderLocations.length - 1].price) {
        orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close })
        profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
        buyOrSell = 'Buy'
      }
    }
    return { orderLocations: orderLocations, profit: profit }
  }
  calculateInterDayShortSma(longValue: number, shortValue: number) {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = longValue - shortValue; i < longValue; i++) {
      windowSum += this.selectedInterDayStockData[i].close;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[longValue - 1].close, avg: (windowSum / shortValue), date: new Date(this.selectedInterDayStockData[longValue - 1].date).toLocaleDateString() }); // Push the average of the first window

    for (let i = longValue; i < this.selectedInterDayStockData.length; i++) {
      windowSum += this.selectedInterDayStockData[i].close - this.selectedInterDayStockData[i - shortValue].close; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[i].close, avg: (windowSum / shortValue), date: new Date(this.selectedInterDayStockData[i].date).toLocaleDateString() }); // Push the new average
    }
    return returnArray
  }
  calculateInterDayMediumSma(longValue: number, mediumValue: number) {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = longValue - mediumValue; i < longValue; i++) {
      windowSum += this.selectedInterDayStockData[i].close;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[longValue - 1].close, avg: (windowSum / mediumValue), date: new Date(this.selectedInterDayStockData[longValue - 1].date).toLocaleDateString() }); // Push the average of the first window

    for (let i = longValue; i < this.selectedInterDayStockData.length; i++) {
      windowSum += this.selectedInterDayStockData[i].close - this.selectedInterDayStockData[i - mediumValue].close; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[i].close, avg: (windowSum / mediumValue), date: new Date(this.selectedInterDayStockData[i].date).toLocaleDateString() }); // Push the new average
    }
    return returnArray
  }
  calculateInterDayLongSma(longValue: number): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = 0; i < longValue; i++) {
      windowSum += this.selectedInterDayStockData[i].close;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[longValue - 1].close, avg: (windowSum / longValue), date: new Date(this.selectedInterDayStockData[longValue - 1].date).toLocaleDateString() });

    for (let i = longValue; i < this.selectedInterDayStockData.length; i++) {
      windowSum += this.selectedInterDayStockData[i].close - this.selectedInterDayStockData[i - longValue].close;
      returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[i].close, avg: (windowSum / longValue), date: new Date(this.selectedInterDayStockData[i].date).toLocaleDateString() });
    }
    return returnArray
  }

  calculateBuyAndSellPointsInterDay() {
    let buyOrSell = 'Buy'
    let orderLocations: orderLocation[] = []
    let totalProfit = 0
    for (let i = 0; i < this.shortSmaResults.length; i++) {
      if (buyOrSell == 'Buy' && ((((this.shortSmaResults[i].avg - this.mediumSmaResults[i].avg) / this.mediumSmaResults[i].avg) < (this.buyGutter * -1)) && (((this.shortSmaResults[i].avg - this.longSmaResults[i].avg) / this.longSmaResults[i].avg) < this.check200Gutter))) {
        orderLocations.push({ buySell: 'Buy', date: this.shortSmaResults[i].date, price: this.shortSmaResults[i].close })
        buyOrSell = 'Sell'
      }
      else if (buyOrSell == 'Sell' && ((((this.shortSmaResults[i].avg - this.mediumSmaResults[i].avg) / this.mediumSmaResults[i].avg) > this.sellGutter) && this.shortSmaResults[i].close > orderLocations[orderLocations.length - 1].price)) {
        orderLocations.push({ buySell: 'Sell', date: this.shortSmaResults[i].date, price: this.shortSmaResults[i].close })
        totalProfit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
        buyOrSell = 'Buy'
      }
    }
    return { orderLocations: orderLocations, profit: totalProfit }
  }
  updateGraphBuyAndSellPoints(orderLocations: orderLocation[]) {
    let annotationsArray: any[] = []
    for (let i = 0; i < orderLocations.length; i++) {
      annotationsArray.push({
        type: 'line',
        //display: this.selectedStockHistoryData.length > 0,
        xMin: this.longSmaResults.findIndex(x => x.date == orderLocations[i].date),
        xMax: this.longSmaResults.findIndex(x => x.date == orderLocations[i].date),
        borderColor: '#7874ff',
        borderWidth: 2,
        label: {
          display: true,
          content: orderLocations[i].buySell + ': ' + orderLocations[i].price,
          position: 'end'
        }
      })
    }
    this.stockChart.options.plugins.annotation.annotations = annotationsArray
    this.stockChart.update()
  }

  calculateSmaValuesInterDaySingleRun() {
    this.longSmaResults.length = 0
    this.mediumSmaResults.length = 0
    this.shortSmaResults.length = 0

    let windowSum = 0

    //calculate the long sma values
    for (let i = 0; i < this.interDayLongSma; i++) {
      windowSum += this.selectedInterDayStockData[i].close
    }
    this.longSmaResults.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[this.interDayLongSma - 1].close, avg: windowSum / this.interDayLongSma, date: new Date(this.selectedInterDayStockData[this.interDayLongSma - 1].date).toLocaleDateString() })

    for (let j = this.interDayLongSma; j < this.selectedInterDayStockData.length; j++) {
      windowSum += this.selectedInterDayStockData[j].close - this.selectedInterDayStockData[j - this.interDayLongSma].close;
      this.longSmaResults.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[j].close, avg: windowSum / this.interDayLongSma, date: new Date(this.selectedInterDayStockData[j].date).toLocaleDateString() })
    }

    windowSum = 0
    //calculate the medium sma values
    for (let i = this.interDayLongSma - this.interDayMediumSma; i < this.interDayLongSma; i++) {
      windowSum += this.selectedInterDayStockData[i].close
    }
    this.mediumSmaResults.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[this.interDayLongSma - 1].close, avg: windowSum / this.interDayMediumSma, date: new Date(this.selectedInterDayStockData[this.interDayLongSma - 1].date).toLocaleDateString() })

    for (let j = this.interDayLongSma; j < this.selectedInterDayStockData.length; j++) {
      windowSum += this.selectedInterDayStockData[j].close - this.selectedInterDayStockData[j - this.interDayMediumSma].close;
      this.mediumSmaResults.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[j].close, avg: windowSum / this.interDayMediumSma, date: new Date(this.selectedInterDayStockData[j].date).toLocaleDateString() })
    }

    windowSum = 0
    //calculate the short sma values
    for (let i = this.interDayLongSma - this.interDayShortSma; i < this.interDayLongSma; i++) {
      windowSum += this.selectedInterDayStockData[i].close
    }
    this.shortSmaResults.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[this.interDayLongSma - 1].close, avg: windowSum / this.interDayShortSma, date: new Date(this.selectedInterDayStockData[this.interDayLongSma - 1].date).toLocaleDateString() })

    for (let j = this.interDayLongSma; j < this.selectedInterDayStockData.length; j++) {
      windowSum += this.selectedInterDayStockData[j].close - this.selectedInterDayStockData[j - this.interDayShortSma].close;
      this.shortSmaResults.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[j].close, avg: windowSum / this.interDayShortSma, date: new Date(this.selectedInterDayStockData[j].date).toLocaleDateString() })
    }
  }
  updateChart() {
    this.stockChart.data.datasets[0].data = this.longSmaResults.map(e => e.close)
    this.stockChart.data.datasets[0].label = 'Actual'
    this.stockChart.data.datasets[1].data = this.longSmaResults.map(e => e.avg)
    this.stockChart.data.datasets[1].label = this.interDayLongSma
    this.stockChart.data.datasets[2].data = this.mediumSmaResults.map(e => e.avg)
    this.stockChart.data.datasets[2].label = this.interDayMediumSma
    this.stockChart.data.datasets[3].data = this.shortSmaResults.map(e => e.avg)
    this.stockChart.data.datasets[3].label = this.interDayShortSma
    this.stockChart.data.labels = this.longSmaResults.map(e => e.date)
    this.stockChart.options.scales.y.max = this.getMaxForChart(this.longSmaResults)
    this.stockChart.options.scales.y.min = this.getMinForChart(this.longSmaResults)
    this.stockChart.update()
  }
  calcualateIntraDayRsi() {
    this.rsiData.length = 0
    this.rsiPeriodNum = 300
    let rsiData = this.stockDataForSelectedDay.slice(this.intraDayLongSma - this.rsiPeriodNum - 2)


    let rsiUps = []
    let rsiDowns = []
    for (let i = 1; i <= this.rsiPeriodNum; i++) {
      let change = rsiData[i].stockPrice - rsiData[i - 1].stockPrice
      if (change >= 0) {
        rsiUps.push(change)
      }
      else {
        rsiDowns.push(Math.abs(change))
      }
    }
    let avgUp = rsiUps.reduce((sum, val) => sum + val, 0) / this.rsiPeriodNum
    let avgDown = rsiDowns.reduce((sum, val) => sum + val, 0) / this.rsiPeriodNum

    for (let i = this.rsiPeriodNum + 1; i < rsiData.length; i++) {
      let change = rsiData[i].stockPrice - rsiData[i - 1].stockPrice;
      let gain = change > 0 ? change : 0;
      let loss = change < 0 ? Math.abs(change) : 0;

      // Wilder's smoothing
      avgUp = (avgUp * (this.rsiPeriodNum - 1) + gain) / this.rsiPeriodNum;
      avgDown = (avgDown * (this.rsiPeriodNum - 1) + loss) / this.rsiPeriodNum;

      const rs = avgDown === 0 ? 100 : avgUp / avgDown;
      const rsi = 100 - (100 / (1 + rs));
      this.rsiData.push({ rsiNum: rsi, date: new Date(rsiData[i].time).toLocaleTimeString() });

    }
    this.rsiChart.data.datasets[0].data = this.rsiData.map(e => e.rsiNum)
    this.rsiChart.data.labels = this.rsiData.map(e => e.date)
    this.rsiChart.update()
  }

  selectedStockBasicHistoryData: DbStockBasicHistory[] = []
  rsiDateRange: DbStockBasicHistory[] = []
  rsiPeriodNum = 14
  rsiData: any[] = []
  async getStockBasicHistoryData() {
    this.selectedStockBasicHistoryData = await dbStockBasicHistoryRepo.find({ where: { stockName: this.selectedStockName }, orderBy: { date: 'asc' } })
    this.rsiDateRange = this.selectedStockBasicHistoryData.slice(this.interDayLongSma - this.rsiPeriodNum - 2)
    console.log(this.rsiDateRange)
    let rsiUps = []
    let rsiDowns = []
    for (let i = 1; i <= this.rsiPeriodNum; i++) {
      let change = this.rsiDateRange[i].close - this.rsiDateRange[i - 1].close
      if (change >= 0) {
        rsiUps.push(change)
      }
      else {
        rsiDowns.push(Math.abs(change))
      }
    }
    let avgUp = rsiUps.reduce((sum, val) => sum + val, 0) / this.rsiPeriodNum
    let avgDown = rsiDowns.reduce((sum, val) => sum + val, 0) / this.rsiPeriodNum

    for (let i = this.rsiPeriodNum + 1; i < this.rsiDateRange.length; i++) {
      let change = this.rsiDateRange[i].close - this.rsiDateRange[i - 1].close;
      let gain = change > 0 ? change : 0;
      let loss = change < 0 ? Math.abs(change) : 0;

      // Wilder's smoothing
      avgUp = (avgUp * (this.rsiPeriodNum - 1) + gain) / this.rsiPeriodNum;
      avgDown = (avgDown * (this.rsiPeriodNum - 1) + loss) / this.rsiPeriodNum;

      const rs = avgDown === 0 ? 100 : avgUp / avgDown;
      const rsi = 100 - (100 / (1 + rs));
      this.rsiData.push({ rsiNum: rsi, date: new Date(this.rsiDateRange[i].date).toLocaleDateString() });
    }
    console.log(this.rsiData)
    this.createOrUpdateRsiChart()
  }


  async ngOnInit() {
    Chart.register(annotationPlugin);
    Chart.register(...registerables)
    this.isLoading = true
    this.allHistory = await dbStockBasicHistoryRepo.find({where: {}, orderBy: { stockName: 'asc', date: 'asc' } })
    this.distinctStocks = this.allHistory.map(e => e.stockName).filter((v, i, a) => a.indexOf(v) === i)
    this.selectedStockName = this.distinctStocks[0]
    this.selectedInterDayStockData = this.allHistory.filter(e => e.stockName == this.selectedStockName)
    console.log(this.selectedInterDayStockData)
    this.interDayLongSma = 200
    this.interDayMediumSma = 40
    this.interDayShortSma = 5
    this.createOrUpdateChart()
    this.runSimulation()
    await this.getStockHistoricalData()
    await this.getStockBasicHistoryData();
    this.isLoading = false;

  }
}
