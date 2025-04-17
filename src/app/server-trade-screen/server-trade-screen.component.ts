import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DbAlgorithmList, dbAlgorithmListRepo } from '../../shared/tasks/dbAlgorithmList';
import { remult } from 'remult';
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
import { empty } from 'rxjs';
import { SimulationController } from '../../shared/controllers/SimulationController';



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
  numberOfTrades: number;
  //listOfTrades: orderLocation[];
}
type orderLocation = {
  buySell: string;
  date: string;
  price: number;
}
type smaLists = {
  value: number;
  sma: sma200Array[]
}
type smaChildLists = {
  type: string;
  value: number;
  longValue: number;
  sma: sma200Array[]
}
type smaListLookup = {
  long: number;
  value: number;
}
type smaDayListLongLookup = {
  day: string;
  longValue: number;
}
type smaDayListMediumShortLookup = {
  day: string;
  longValue: number;
  value: number;
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
  listOfLast200Days: sma200Array[] = []
  listOfLast40Days: sma200Array[] = []
  listOfLast5Days: sma200Array[] = []
  selectedStockName: string = ''
  selectedStockLast200: sma200Array[] = []
  selectedStockLast40: sma200Array[] = []
  selectedStockLast5: sma200Array[] = []
  stockChart: any;
  distinctStocks: string[] = []
  annotationsArray: any[] = []
  intraDayChecked: boolean = false;
  distinctDates: string[] = []
  selectedDate: string = ''
  stockDataForSelectedDay: DbStockHistoryData[] = []
  listOfLastHour: sma200Array[] = []
  listOfLast30Minutes: sma200Array[] = []
  listOfLast5Minutes: sma200Array[] = []
  displayedColumns: string[] = ['Profit', 'NoTrades', 'BuyGutter', 'SellGutter', 'CheckGutter', 'smaLong', 'smaMedium', 'smaShort']
  intraDayLongSma: number = 0
  intraDayMediumSma: number = 0
  intraDayShortSma: number = 0

  interDayLongSma: number = 0;
  interDayMediumSma: number = 0
  interDayShortSma: number = 0
  private worker!: Worker;


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
        //this.getStockDisplay()
        this.calculateSma()
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

        labels: this.listOfLast200Days.map(e => e.date),

        datasets: [
          {
            label: 'Actual',
            data: this.listOfLast200Days.map(e => e.close),
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
            data: this.listOfLast200Days.map(e => e.avg),
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
            data: this.listOfLast40Days.map(e => e.avg),
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
            data: this.listOfLast5Days.map(e => e.avg),
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
            max: this.getMaxForChart(this.listOfLast200Days),
            min: this.getMinForChart(this.listOfLast200Days),
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

  buyGutter: number = .05;
  sellGutter: number = .15;
  check200Gutter: number = .1;
  shouldDisplayBuySellLines: boolean = false;

  bankTotal: number = 500
  orderLocations: orderLocation[] = []
  executeOrder(arr: sma200Array, buySell: string) {
    let orderLocations: orderLocation[] = []
    if (buySell == 'Buy') {
      this.orderLocations.push({ buySell: 'Buy', date: arr.date, price: arr.close })
    }
    else {
      this.orderLocations.push({ buySell: 'Sell', date: arr.date, price: arr.close })
    }
  }

  totalPofit: number = 0;

  calculateTotalProfit() {
    for (let i = 0; i < this.orderLocations.length; i++) {
      if (this.orderLocations[i].buySell == 'Sell') {
        this.totalPofit += this.orderLocations[i].price - this.orderLocations[i - 1].price
      }
    }
  }
  calculateTotalProfitNew(orderLocations: orderLocation[]): number {
    let returnPofit: number = 0;
    for (let i = 0; i < orderLocations.length; i++) {
      if (orderLocations[i].buySell == 'Sell') {
        returnPofit += orderLocations[i].price - orderLocations[i - 1].price
      }
    }
    return returnPofit
  }

  /* Buttons */

  async changeDayType() {
    this.topAlgos = []
    this.topAlgosAllDays = []
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
      this.isLoading = false
    }
    else {
      this.isLoading = true
      this.buyGutter = .05
      this.sellGutter = .01
      this.check200Gutter = .1
      //this.getStockDisplay()
      this.calculateSma()
      this.updateChart()
      this.runSimulation()
      this.isLoading = false
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
    await this.runEntireSimulationIntraDayAllDays2()
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
    //await this.updateStockChartData()
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
    /* this.listOfLastHour = []
    this.listOfLast30Minutes = []
    this.listOfLast5Minutes = []
    let tempStockHour: sma200Array[] = []
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      let lastHourPrice: number = 0;
      for (let k = 0; k < this.intraDayLongSma; k++) {
        lastHourPrice += this.stockDataForSelectedDay[j - k].stockPrice
      }
      let lastHourAvg = lastHourPrice / this.intraDayLongSma
      //, date: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString()
      tempStockHour.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: lastHourAvg, date: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }
    let tempStock30Minutes: sma200Array[] = []
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      let last30MinutesPrice: number = 0;
      for (let k = 0; k < this.intraDayMediumSma; k++) {
        last30MinutesPrice += this.stockDataForSelectedDay[j - k].stockPrice
      }
      let last30MinutesAvg = last30MinutesPrice / this.intraDayMediumSma
      tempStock30Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: last30MinutesAvg, date: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }
    let tempStock5Minutes: sma200Array[] = []
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      let last5MinutesPrice: number = 0;
      for (let k = 0; k < this.intraDayShortSma; k++) {
        last5MinutesPrice += this.stockDataForSelectedDay[j - k].stockPrice
      }
      let last5MinutesAvg = last5MinutesPrice / this.intraDayShortSma
      tempStock5Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: last5MinutesAvg, date: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }
    this.listOfLastHour.push(...tempStockHour)
    this.listOfLast30Minutes.push(...tempStock30Minutes)
    this.listOfLast5Minutes.push(...tempStock5Minutes) */

    this.listOfLastHour = []
    this.listOfLast30Minutes = []
    this.listOfLast5Minutes = []
    
    for(let i = this.stockDataForSelectedDay.length - 1; i >= this.intraDayLongSma; i--){
      let longSma: number = 0
      for(let j = 0; j < this.intraDayLongSma; j++){
        longSma += this.stockDataForSelectedDay[i - j].stockPrice
      }
      this.listOfLastHour.unshift({stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: longSma / this.intraDayLongSma, date: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString()})
    }
    for(let i = this.stockDataForSelectedDay.length - 1; i >= this.intraDayLongSma; i--){
      let mediumSma: number = 0
      for(let j = 0; j < this.intraDayMediumSma; j++){
        mediumSma += this.stockDataForSelectedDay[i - j].stockPrice
      }
      this.listOfLast30Minutes.unshift({stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: mediumSma / this.intraDayMediumSma, date: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString()})
    }
    for(let i = this.stockDataForSelectedDay.length - 1; i >= this.intraDayLongSma; i--){
      let shortSma: number = 0
      for(let j = 0; j < this.intraDayShortSma; j++){
        shortSma += this.stockDataForSelectedDay[i - j].stockPrice
      }
      this.listOfLast5Minutes.unshift({stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: shortSma / this.intraDayShortSma, date: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString()})
    }
  }
  calculateIntraDayShortSma(longValue: number, shortValue: number) {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = longValue - shortValue; i < longValue; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[longValue].stockPrice, avg: (windowSum / shortValue), date: new Date(this.stockDataForSelectedDay[longValue].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < this.stockDataForSelectedDay.length; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - shortValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: (windowSum / shortValue), date: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  calculateIntraDayMediumSma(longValue: number, mediumValue: number) {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = longValue - mediumValue; i < longValue; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[longValue].stockPrice, avg: (windowSum / mediumValue), date: new Date(this.stockDataForSelectedDay[longValue].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < this.stockDataForSelectedDay.length; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - mediumValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: (windowSum / mediumValue), date: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  calculateIntraDayLongSma(longValue: number): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = 0; i < longValue; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[longValue].stockPrice, avg: (windowSum / longValue), date: new Date(this.stockDataForSelectedDay[longValue].time).toLocaleTimeString() });

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
    returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[longValue].stockPrice, avg: (windowSum / shortValue), date: new Date(selectedStockData[longValue].time).toLocaleTimeString() }); // Push the average of the first window

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
  calculateIntraDayMediumSmaNew(mediumValue: number): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0
    for (let i = 0; i < mediumValue; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[mediumValue].stockPrice, avg: (windowSum / mediumValue), date: new Date(this.stockDataForSelectedDay[mediumValue].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = mediumValue; i < this.stockDataForSelectedDay.length; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - mediumValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: (windowSum / mediumValue), date: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  calculateIntraDayShortSmaNew(shortValue: number): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0
    for (let i = 0; i < shortValue; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[shortValue].stockPrice, avg: (windowSum / shortValue), date: new Date(this.stockDataForSelectedDay[shortValue].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = shortValue; i < this.stockDataForSelectedDay.length; i++) {
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
  topAlgosAllDays: bufferAlgo[] = []
  runSimulationIntraDay() {
    this.bankTotal = 500
    this.orderLocations = []
    this.totalPofit = 0
    this.calculateIntraDaySma()
    this.updateChartIntraDay()
    this.calculateBuyAndSellPointsIntraDay()
    this.updateGraphBuyAndSellPointsIntraDay()
    this.calculateTotalProfit()
  }
  onRunEntireSimulation() {
    this.isLoading = true;
    if (this.intraDayChecked) {
      this.runEntireSimulationIntraDay2()
    }
    else {
      this.runEntireSimulationInterDay()
    }

    this.isLoading = false
  }
  listOfChildSmaValues: smaChildLists[] = []
  listOfLongSmaValues: smaLists[] = []


  runEntireSimulationIntraDay() {
    let listOfProfits = []
    let minProfit = 0
    let mapOfLongSmaValues = new Map<number, sma200Array[]>()
    let mapOfMediumSmaValues = new Map<number, sma200Array[]>()
    let mapOfShortSmaValues = new Map<number, sma200Array[]>()
    for (let i = 1; i <= 20; i++) {
      for (let j = 1; j <= 20; j++) {
        console.time('sell')
        for (let k = 1; k <= 30; k++) {
          for (let m = 60; m <= 90; m += 5) {
            if (mapOfLongSmaValues.get(m * 60) === undefined) {
              let listOfLastHourResult = this.calculateIntraDayLongSma(m * 60)
              mapOfLongSmaValues.set(
                m * 60,
                listOfLastHourResult
              )
            }

            for (let n = 20; n <= 40; n += 5) {
              if (mapOfMediumSmaValues.get(n * 60) === undefined) {
                let listOfLastMediumResult = this.calculateIntraDayMediumSmaNew(n * 60)
                mapOfMediumSmaValues.set(
                  n * 60,
                  listOfLastMediumResult
                )
              }
              for (let p = 1; p <= 10; p++) {
                if (mapOfShortSmaValues.get(p * 60) === undefined) {
                  let listOfLastShortResult = this.calculateIntraDayShortSmaNew(p * 60)
                  mapOfShortSmaValues.set(
                    p * 60,
                    listOfLastShortResult
                  )
                }
                let orderLocations = this.calculateBuyAndSellPointsIntraDayNew2(mapOfLongSmaValues.get(m * 60)!, mapOfMediumSmaValues.get(n * 60)!, mapOfShortSmaValues.get(p * 60)!, Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3)))
                let totalProfit = this.calculateTotalProfitNew(orderLocations)

                if (listOfProfits.length < 5) {
                  listOfProfits.push({
                    buyBuffer: Number((i * .001).toPrecision(3)),
                    sellBuffer: Number((j * .001).toPrecision(3)),
                    checkBuffer: Number((k * .001).toPrecision(3)),
                    smaLong: m * 60,
                    smaMedium: n * 60,
                    smaShort: p * 60,
                    profit: totalProfit,
                    numberOfTrades: orderLocations.length
                  })
                  listOfProfits.sort((a, b) => b.profit - a.profit)
                }
                else if (totalProfit > listOfProfits[4].profit) {
                  listOfProfits[4] = {
                    buyBuffer: Number((i * .001).toPrecision(3)),
                    sellBuffer: Number((j * .001).toPrecision(3)),
                    checkBuffer: Number((k * .001).toPrecision(3)),
                    smaLong: m * 60,
                    smaMedium: n * 60,
                    smaShort: p * 60,
                    profit: totalProfit,
                    numberOfTrades: orderLocations.length
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
    console.log(listOfProfits.length)
    this.topAlgos = listOfProfits
    this.buyGutter = this.topAlgos[0].buyBuffer
    this.sellGutter = this.topAlgos[0].sellBuffer
    this.check200Gutter = this.topAlgos[0].checkBuffer
    this.intraDayLongSma = this.topAlgos[0].smaLong
    this.intraDayMediumSma = this.topAlgos[0].smaMedium
    this.intraDayShortSma = this.topAlgos[0].smaShort
    this.calculateIntraDaySma()
    this.runSimulationIntraDay()

  }
  runEntireSimulationIntraDay2() {
    let listOfProfits = []
    let minProfit = 0
    let mapOfLongSmaValues = new Map<number, sma200Array[]>()
    let mapOfMediumSmaValues = new Map<number, sma200Array[]>()
    let mapOfShortSmaValues = new Map<number, sma200Array[]>()
    for (let i = 1; i <= 20; i++) {
      for (let j = 1; j <= 20; j++) {
        console.time('sell')
        for (let k = 1; k <= 30; k++) {
          for (let m = 60; m <= 90; m += 5) {
            if (mapOfLongSmaValues.get(m * 60) === undefined) {
              let listOfLastHourResult = this.calculateIntraDayLongSma(m * 60)
              mapOfLongSmaValues.set(
                m * 60,
                listOfLastHourResult
              )
            }

            for (let n = 20; n <= 40; n += 5) {
              if (mapOfMediumSmaValues.get(n * 60) === undefined) {
                let listOfLastMediumResult = this.calculateIntraDayMediumSmaNew(n * 60)
                mapOfMediumSmaValues.set(
                  n * 60,
                  listOfLastMediumResult
                )
              }
              for (let p = 1; p <= 10; p++) {
                if (mapOfShortSmaValues.get(p * 60) === undefined) {
                  let listOfLastShortResult = this.calculateIntraDayShortSmaNew(p * 60)
                  mapOfShortSmaValues.set(
                    p * 60,
                    listOfLastShortResult
                  )
                }
                let orderLocations = this.calculateBuyAndSellPointsIntraDaySellAtEnd(mapOfLongSmaValues.get(m * 60)!, mapOfMediumSmaValues.get(n * 60)!, mapOfShortSmaValues.get(p * 60)!, Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3)))
                let totalProfit = this.calculateTotalProfitNew(orderLocations)

                if (listOfProfits.length < 5) {
                  listOfProfits.push({
                    buyBuffer: Number((i * .001).toPrecision(3)),
                    sellBuffer: Number((j * .001).toPrecision(3)),
                    checkBuffer: Number((k * .001).toPrecision(3)),
                    smaLong: m * 60,
                    smaMedium: n * 60,
                    smaShort: p * 60,
                    profit: totalProfit,
                    numberOfTrades: orderLocations.length
                  })
                  listOfProfits.sort((a, b) => b.profit - a.profit)
                }
                else if (totalProfit > listOfProfits[4].profit) {
                  listOfProfits[4] = {
                    buyBuffer: Number((i * .001).toPrecision(3)),
                    sellBuffer: Number((j * .001).toPrecision(3)),
                    checkBuffer: Number((k * .001).toPrecision(3)),
                    smaLong: m * 60,
                    smaMedium: n * 60,
                    smaShort: p * 60,
                    profit: totalProfit,
                    numberOfTrades: orderLocations.length
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
    console.log(listOfProfits.length)
    this.topAlgos = listOfProfits
    this.buyGutter = this.topAlgos[0].buyBuffer
    this.sellGutter = this.topAlgos[0].sellBuffer
    this.check200Gutter = this.topAlgos[0].checkBuffer
    this.intraDayLongSma = this.topAlgos[0].smaLong
    this.intraDayMediumSma = this.topAlgos[0].smaMedium
    this.intraDayShortSma = this.topAlgos[0].smaShort
    this.runSimulationIntraDay()

  }



  async runEntireSimulationIntraDayAllDays() {
    let listOfProfits = []
    console.log(this.distinctDates)
    let numberOfDays = 5
    let mapOfDateData = new Map<string, DbStockHistoryData[]>()
    for (let h = 0; h <= numberOfDays - 1; h++) {
      let data = await this.updateStockChartDataNew(this.distinctDates[h])
      mapOfDateData.set(this.distinctDates[h], data)
    }

    let mapOfLongSmaValues = new Map<string, sma200Array[]>()
    let mapOfMediumSmaValues = new Map<string, sma200Array[]>()
    let mapOfShortSmaValues = new Map<string, sma200Array[]>()
    for (let i = 1; i <= 20; i++) {
      for (let j = 1; j <= 20; j++) {
        console.time('sell')
        for (let k = 1; k <= 30; k++) {
          for (let m = 60; m <= 90; m += 5) {
            
            for (let n = 20; n <= 40; n += 5) {
              
              for (let p = 1; p <= 10; p++) {
                let profit = 0
                let orderLocations = []
                for(let x = 0; x <= numberOfDays - 1; x++){
                  this.stockDataForSelectedDay = mapOfDateData.get(this.selectedDate[x])!
                  if (mapOfLongSmaValues.get(JSON.stringify({ date: this.selectedDate[x], value: m * 60})) === undefined) {
                    let listOfLastHourResult = this.calculateIntraDayLongSma(m * 60)
                    mapOfLongSmaValues.set(
                      JSON.stringify({ date: this.selectedDate[x], value: m * 60}),
                      listOfLastHourResult
                    )
                  }
                  if (mapOfMediumSmaValues.get(JSON.stringify({ date: this.selectedDate[x], value: n * 60})) === undefined) {
                    let listOfLastMediumResult = this.calculateIntraDayMediumSmaNew(n * 60)
                    mapOfMediumSmaValues.set(
                      JSON.stringify({ date: this.selectedDate[x], value: n * 60}),
                      listOfLastMediumResult
                    )
                  }
                  if (mapOfShortSmaValues.get(JSON.stringify({ date: this.selectedDate[x], value: p * 60})) === undefined) {
                    let listOfLastShortResult = this.calculateIntraDayShortSmaNew(p * 60)
                    mapOfShortSmaValues.set(
                      JSON.stringify({ date: this.selectedDate[x], value: p * 60}),
                      listOfLastShortResult
                    )
                  }
                  orderLocations.push(...this.calculateBuyAndSellPointsIntraDayNew2(mapOfLongSmaValues.get(JSON.stringify({ date: this.selectedDate[x], value: m * 60}))!, mapOfMediumSmaValues.get(JSON.stringify({ date: this.selectedDate[x], value: n * 60}))!, mapOfShortSmaValues.get(JSON.stringify({ date: this.selectedDate[x], value: p * 60}))!, Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3))))
                  
  
                  
                }
                profit = this.calculateTotalProfitNew(orderLocations)
                listOfProfits.push({
                  buyBuffer: Number((i * .001).toPrecision(3)),
                  sellBuffer: Number((j * .001).toPrecision(3)),
                  checkBuffer: Number((k * .001).toPrecision(3)),
                  smaLong: m * 60,
                  smaMedium: n * 60,
                  smaShort: p * 60,
                  profit: profit,
                  numberOfTrades: orderLocations.length
                })
              }
            }

          }

        }
        console.timeEnd('sell')
      }
      console.log('finished outer loop iteration')
    }
    console.log('finsihed: ')



  }
  async runEntireSimulationIntraDayAllDays2() {
    let listOfProfits = []
    console.log(this.distinctDates)
    let numberOfDays = 5
    for (let h = 0; h <= numberOfDays - 1; h++) {
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
              if (mapOfLongSmaValues.get(m * 60) === undefined) {
                let listOfLastHourResult = this.calculateIntraDayLongSma(m * 60)
                mapOfLongSmaValues.set(
                  m * 60,
                  listOfLastHourResult
                )
              }
              for (let n = 20; n <= 40; n += 5) {
                if (mapOfMediumSmaValues.get(n * 60) === undefined) {
                  let listOfLastMediumResult = this.calculateIntraDayMediumSmaNew(n * 60)
                  mapOfMediumSmaValues.set(
                    n * 60,
                    listOfLastMediumResult
                  )
                }
                for (let p = 1; p <= 10; p++) {
                  if (mapOfShortSmaValues.get(p * 60) === undefined) {
                    let listOfLastShortResult = this.calculateIntraDayShortSmaNew(p * 60)
                    mapOfShortSmaValues.set(
                      p * 60,
                      listOfLastShortResult
                    )
                  }
                  let orderLocations = this.calculateBuyAndSellPointsIntraDayNew2(mapOfLongSmaValues.get(m * 60)!, mapOfMediumSmaValues.get(n * 60)!, mapOfShortSmaValues.get(p * 60)!, Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3)))
                  let totalProfit = this.calculateTotalProfitNew(orderLocations)

                  listOfProfits.push({
                    buyBuffer: Number((i * .001).toPrecision(3)),
                    sellBuffer: Number((j * .001).toPrecision(3)),
                    checkBuffer: Number((k * .001).toPrecision(3)),
                    smaLong: m * 60,
                    smaMedium: n * 60,
                    smaShort: p * 60,
                    profit: totalProfit,
                    numberOfTrades: orderLocations.length
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
    let count = 0
    for (let i = 0; i < 4200000; i++) {
      let filteredData = []
      filteredData.push(listOfProfits[i])
      for (let j = 1; j < numberOfDays; j++) {
        filteredData.push(listOfProfits[i + (j * 4200000)])
      }
      if (count == 0) {
        console.log('filtered data below')
        console.log(filteredData)
        count++
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
  }
  calculateBuyAndSellPointsIntraDayNew(longArray: sma200Array[], mediumArray: sma200Array[], shortArray: sma200Array[], buyGutter: number, sellGutter: number, checkGutter: number) {
    let buyOrSell = 'Buy'
    let orderLocations: orderLocation[] = []
    for (let i = 0; i < shortArray.length; i++) {
      if (buyOrSell == 'Buy' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) < (buyGutter * -1)) && (((shortArray[i].avg - longArray[i].avg) / longArray[i].avg) < checkGutter)) {
        //this.executeOrder(shortArray[i], 'Buy')
        orderLocations.push({ buySell: 'Buy', date: shortArray[i].date, price: shortArray[i].close })
        buyOrSell = 'Sell'
      }
      else if (buyOrSell == 'Sell' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) > sellGutter) && shortArray[i].close > orderLocations[orderLocations.length - 1].price) {
        //this.executeOrder(shortArray[i], 'Sell')
        orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close })
        buyOrSell = 'Buy'
      }


    }
    return orderLocations
  }
  calculateBuyAndSellPointsIntraDayNew2(longArray: sma200Array[], mediumArray: sma200Array[], shortArray: sma200Array[], buyGutter: number, sellGutter: number, checkGutter: number) {
    let buyOrSell = 'Buy'
    let orderLocations: orderLocation[] = []
    let longArrayLen = longArray.length
    let mediumArrayLen = mediumArray.length
    let shortArrayLen = shortArray.length
    for (let i = 0; i < longArray.length; i++) {
      if (buyOrSell == 'Buy' && (((shortArray[i + (shortArrayLen - longArrayLen)].avg - mediumArray[i + (mediumArrayLen - longArrayLen)].avg) / mediumArray[i + (mediumArrayLen - longArrayLen)].avg) < (buyGutter * -1)) && (((shortArray[i + (shortArrayLen - longArrayLen)].avg - longArray[i].avg) / longArray[i].avg) < checkGutter)) {
        //this.executeOrder(shortArray[i], 'Buy')
        orderLocations.push({ buySell: 'Buy', date: shortArray[i + (shortArrayLen - longArrayLen)].date, price: shortArray[i + (shortArrayLen - longArrayLen)].close })
        buyOrSell = 'Sell'
      }
      else if (buyOrSell == 'Sell' && (((shortArray[i + (shortArrayLen - longArrayLen)].avg - mediumArray[i + (mediumArrayLen - longArrayLen)].avg) / mediumArray[i + (mediumArrayLen - longArrayLen)].avg) > sellGutter) && shortArray[i + (shortArrayLen - longArrayLen)].close > orderLocations[orderLocations.length - 1].price) {
        //this.executeOrder(shortArray[i], 'Sell')
        orderLocations.push({ buySell: 'Sell', date: shortArray[i + (shortArrayLen - longArrayLen)].date, price: shortArray[i + (shortArrayLen - longArrayLen)].close })
        buyOrSell = 'Buy'
      }


    }
    return orderLocations
  }
  calculateBuyAndSellPointsIntraDaySellAtEnd(longArray: sma200Array[], mediumArray: sma200Array[], shortArray: sma200Array[], buyGutter: number, sellGutter: number, checkGutter: number) {
    let buyOrSell = 'Buy'
    let orderLocations: orderLocation[] = []
    let longArrayLen = longArray.length
    let mediumArrayLen = mediumArray.length
    let shortArrayLen = shortArray.length
    for (let i = 0; i < longArray.length; i++) {
      if (buyOrSell == 'Buy' && (((shortArray[i + (shortArrayLen - longArrayLen)].avg - mediumArray[i + (mediumArrayLen - longArrayLen)].avg) / mediumArray[i + (mediumArrayLen - longArrayLen)].avg) < (buyGutter * -1)) && (((shortArray[i + (shortArrayLen - longArrayLen)].avg - longArray[i].avg) / longArray[i].avg) < checkGutter)) {
        //this.executeOrder(shortArray[i], 'Buy')
        orderLocations.push({ buySell: 'Buy', date: shortArray[i + (shortArrayLen - longArrayLen)].date, price: shortArray[i + (shortArrayLen - longArrayLen)].close })
        buyOrSell = 'Sell'
      }
      else if (buyOrSell == 'Sell' && (((shortArray[i + (shortArrayLen - longArrayLen)].avg - mediumArray[i + (mediumArrayLen - longArrayLen)].avg) / mediumArray[i + (mediumArrayLen - longArrayLen)].avg) > sellGutter) && shortArray[i + (shortArrayLen - longArrayLen)].close > orderLocations[orderLocations.length - 1].price) {
        //this.executeOrder(shortArray[i], 'Sell')
        orderLocations.push({ buySell: 'Sell', date: shortArray[i + (shortArrayLen - longArrayLen)].date, price: shortArray[i + (shortArrayLen - longArrayLen)].close })
        buyOrSell = 'Buy'
      }
      else if(buyOrSell == 'Sell' && i == longArray.length - 1){
        orderLocations.push({ buySell: 'Sell', date: shortArray[i + (shortArrayLen - longArrayLen)].date, price: shortArray[i + (shortArrayLen - longArrayLen)].close })
        buyOrSell = 'Buy'
      }


    }
    return orderLocations
  }
  calculateBuyAndSellPointsIntraDay() {
    let buyOrSell = 'Buy'
    for (let i = 0; i < this.listOfLast5Minutes.length; i++) {
      if (buyOrSell == 'Buy' && (((this.listOfLast5Minutes[i].avg - this.listOfLast30Minutes[i].avg) / this.listOfLast30Minutes[i].avg) < (this.buyGutter * -1)) && (((this.listOfLast5Minutes[i].avg - this.listOfLastHour[i].avg) / this.listOfLastHour[i].avg) < this.check200Gutter)) {
        this.executeOrder(this.listOfLast5Minutes[i], 'Buy')
        buyOrSell = 'Sell'
      }
      else if (buyOrSell == 'Sell' && (((this.listOfLast5Minutes[i].avg - this.listOfLast30Minutes[i].avg) / this.listOfLast30Minutes[i].avg) > this.sellGutter) && this.listOfLast5Minutes[i].close > this.orderLocations[this.orderLocations.length - 1].price) {
        this.executeOrder(this.listOfLast5Minutes[i], 'Sell')
        buyOrSell = 'Buy'
      }


    }
  }
  updateGraphBuyAndSellPointsIntraDay() {
    this.annotationsArray = []
    for (let i = 0; i < this.orderLocations.length; i++) {
      this.annotationsArray.push({
        type: 'line',
        //display: this.selectedStockHistoryData.length > 0,

        xMin: this.listOfLastHour.findIndex(x => x.date == this.orderLocations[i].date),
        xMax: this.listOfLastHour.findIndex(x => x.date == this.orderLocations[i].date),
        borderColor: '#7874ff',
        borderWidth: 2,
        label: {
          display: true,
          content: this.orderLocations[i].buySell + ': ' + this.orderLocations[i].price,
          position: 'end'
        }
      })
    }
    this.stockChart.options.plugins.annotation.annotations = this.annotationsArray
    this.stockChart.update()
  }

  /* Inter Day */
  runSimulation() {
    this.bankTotal = 500
    this.orderLocations = []
    this.totalPofit = 0
    this.calculateSmaNew()
    this.updateChart()
    this.calculateBuyAndSellPoints()
    this.updateGraphBuyAndSellPoints()
    this.calculateTotalProfit()
  }
  runEntireSimulationInterDay() {
    let listOfProfits = []
    let mapOfLongSmaValues = new Map<number, sma200Array[]>()
    let mapOfMediumSmaValues = new Map<number, sma200Array[]>()
    let mapOfShortSmaValues = new Map<number, sma200Array[]>()
    let shortSmaResult = this.calculateInterDayShortSma(1)
    for (let i = 1; i < 100; i++) {
      for (let j = 1; j < 100; j++) {
        for (let k = 1; k < 100; k++) {
          for (let m = 150; m <= 250; m += 5) {
            if (mapOfLongSmaValues.get(m) === undefined) {
              let listOfLongResult = this.calculateInterDayLongSma(m)
              mapOfLongSmaValues.set(
                m,
                listOfLongResult
              )
            }
            let newShortSma = shortSmaResult.slice(mapOfLongSmaValues.get(m)!.length * -1)
            for (let n = 5; n <= 30; n += 5) {
              if (mapOfMediumSmaValues.get(n) === undefined) {
                let listOfMediumResult = this.calculateInterDayMediumSma(n)
                mapOfMediumSmaValues.set(
                  n,
                  listOfMediumResult
                )
              }
             // for (let p = 1; p <= 15; p++) {
                /* if (mapOfShortSmaValues.get(1) === undefined) {
                  let listOfShortResult = this.calculateInterDayShortSma(1)
                  mapOfShortSmaValues.set(
                    1,
                    listOfShortResult
                  )
                } */
                  let newMediumSma = mapOfMediumSmaValues.get(n)!.slice(mapOfLongSmaValues.get(m)!.length * -1)

                let orderLocations = this.calculateInterDayBuyAndSellPoints(mapOfLongSmaValues.get(m)!, newMediumSma, newShortSma, Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3)))
                let totalProfit = this.calculateTotalProfitNew(orderLocations)

              
                if(listOfProfits.length < 5){
                  listOfProfits.push({
                    buyBuffer: Number((i * .001).toPrecision(3)),
                    sellBuffer: Number((j * .001).toPrecision(3)),
                    checkBuffer: Number((k * .001).toPrecision(3)),
                    smaLong: m,
                    smaMedium: n,
                    smaShort: 1,
                    profit: totalProfit,
                    numberOfTrades: orderLocations.length
                  })
                  listOfProfits.sort((a,b) => b.profit - a.profit)
                }
                else if(totalProfit > listOfProfits[4].profit){
                  listOfProfits[4] = {
                    buyBuffer: Number((i * .001).toPrecision(3)),
                    sellBuffer: Number((j * .001).toPrecision(3)),
                    checkBuffer: Number((k * .001).toPrecision(3)),
                    smaLong: m,
                    smaMedium: n,
                    smaShort: 1,
                    profit: totalProfit,
                    numberOfTrades: orderLocations.length
                  }
                  listOfProfits.sort((a,b) => b.profit - a.profit)
                }
                
              //}
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

  calculateInterDayBuyAndSellPoints(longArray: sma200Array[], mediumArray: sma200Array[], shortArray: sma200Array[], buyGutter: number, sellGutter: number, checkGutter: number){
    let buyOrSell = 'Buy'
    let orderLocations: orderLocation[] = []
    let longArrayLen = longArray.length
    for (let i = 0; i < longArray.length; i++) {
      if (buyOrSell == 'Buy' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) < (buyGutter * -1)) && (((shortArray[i].avg - longArray[i].avg) / longArray[i].avg) < checkGutter)) {
        //this.executeOrder(shortArray[i], 'Buy')
        orderLocations.push({ buySell: 'Buy', date: shortArray[i].date, price: shortArray[i].close })
        buyOrSell = 'Sell'
      }
      else if (buyOrSell == 'Sell' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) > sellGutter) && shortArray[i].close > orderLocations[orderLocations.length - 1].price) {
        //this.executeOrder(shortArray[i], 'Sell')
        orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close })
        buyOrSell = 'Buy'
      }


    }
    return orderLocations
  }
  calculateInterDayShortSma(shortValue: number) {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = 0; i < shortValue; i++) {
      windowSum += this.selectedInterDayStockData[i].close;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[shortValue].close, avg: (windowSum / shortValue), date: new Date(this.selectedInterDayStockData[shortValue].date).toLocaleDateString() }); // Push the average of the first window

    for (let i = shortValue; i < this.selectedInterDayStockData.length; i++) {
      windowSum += this.selectedInterDayStockData[i].close - this.selectedInterDayStockData[i - shortValue].close; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[i].close, avg: (windowSum / shortValue), date: new Date(this.selectedInterDayStockData[i].date).toLocaleDateString() }); // Push the new average
    }
    return returnArray
  }
  calculateInterDayMediumSma(mediumValue: number) {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = 0; i < mediumValue; i++) {
      windowSum += this.selectedInterDayStockData[i].close;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[mediumValue].close, avg: (windowSum / mediumValue), date: new Date(this.selectedInterDayStockData[mediumValue].date).toLocaleDateString() }); // Push the average of the first window

    for (let i = mediumValue; i < this.selectedInterDayStockData.length; i++) {
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
    returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[longValue].close, avg: (windowSum / longValue), date: new Date(this.selectedInterDayStockData[longValue].date).toLocaleDateString() });

    for (let i = longValue; i < this.selectedInterDayStockData.length; i++) {
      windowSum += this.selectedInterDayStockData[i].close - this.selectedInterDayStockData[i - longValue].close;
      returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[i].close, avg: (windowSum / longValue), date: new Date(this.selectedInterDayStockData[i].date).toLocaleDateString() });
    }
    return returnArray
  }

  calculateBuyAndSellPoints() {
    let buyOrSell = 'Buy'
    for (let i = 0; i < this.listOfLast5Days.length; i++) {
      if (buyOrSell == 'Buy') {
        if ((((this.listOfLast5Days[i].avg - this.listOfLast40Days[i].avg) / this.listOfLast40Days[i].avg) < (this.buyGutter * -1)) && (((this.listOfLast5Days[i].avg - this.listOfLast200Days[i].avg) / this.listOfLast200Days[i].avg) < this.check200Gutter)) {
          this.executeOrder(this.listOfLast5Days[i], 'Buy')
          buyOrSell = 'Sell'
        }
      }
      else {
        if ((((this.listOfLast5Days[i].avg - this.listOfLast40Days[i].avg) / this.listOfLast40Days[i].avg) > this.sellGutter) && this.listOfLast5Days[i].close > this.orderLocations[this.orderLocations.length - 1].price) {
          this.executeOrder(this.listOfLast5Days[i], 'Sell')
          buyOrSell = 'Buy'
        }
      }

    }
  }
  updateGraphBuyAndSellPoints() {
    console.log(this.orderLocations)
    this.annotationsArray = []
    for (let i = 0; i < this.orderLocations.length; i++) {
      this.annotationsArray.push({
        type: 'line',
        //display: this.selectedStockHistoryData.length > 0,
        xMin: this.listOfLast200Days.findIndex(x => x.date == this.orderLocations[i].date),
        xMax: this.listOfLast200Days.findIndex(x => x.date == this.orderLocations[i].date),
        borderColor: '#7874ff',
        borderWidth: 2,
        label: {
          display: true,
          content: this.orderLocations[i].buySell + ': ' + this.orderLocations[i].price,
          position: 'end'
        }
      })
    }
    this.stockChart.options.plugins.annotation.annotations = this.annotationsArray
    this.stockChart.update()
  }
  calculateSma() {
    this.listOfLast200Days = []
    this.listOfLast40Days = []
    this.listOfLast5Days = []
    let tempStock200: sma200Array[] = []
    for (let j = this.interDayLongSma; j < this.selectedInterDayStockData.length; j++) {
      let last200Price: number = 0;
      for (let k = 0; k < this.interDayLongSma; k++) {
        last200Price += this.selectedInterDayStockData[j - k].close
      }
      let last200Avg = last200Price / this.interDayLongSma
      tempStock200.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[j].close, avg: last200Avg, date: new Date(this.selectedInterDayStockData[j].date).toLocaleDateString() })
    }
    let tempStock40: sma200Array[] = []
    for (let j = this.interDayLongSma; j < this.selectedInterDayStockData.length; j++) {
      let last50Price: number = 0;
      for (let k = 0; k < this.interDayMediumSma; k++) {
        last50Price += this.selectedInterDayStockData[j - k].close
      }
      let last200Avg = last50Price / this.interDayMediumSma
      tempStock40.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[j].close, avg: last200Avg, date: new Date(this.selectedInterDayStockData[j].date).toLocaleDateString() })
    }
    let tempStock5: sma200Array[] = []
    for (let j = this.interDayLongSma; j < this.selectedInterDayStockData.length; j++) {
      let last50Price: number = 0;
      for (let k = 0; k < this.interDayShortSma; k++) {
        last50Price += this.selectedInterDayStockData[j - k].close
      }
      let last200Avg = last50Price / this.interDayShortSma
      tempStock5.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[j].close, avg: last200Avg, date: new Date(this.selectedInterDayStockData[j].date).toLocaleDateString() })
    }
    this.listOfLast200Days.push(...tempStock200)
    this.listOfLast40Days.push(...tempStock40)
    this.listOfLast5Days.push(...tempStock5)
    console.log(this.listOfLast200Days)
    console.log(this.listOfLast40Days)
    console.log(this.listOfLast5Days)

  }
  calculateSmaNew(){
    this.listOfLast200Days = []
    this.listOfLast40Days = []
    this.listOfLast5Days = []
    
    for(let i = this.selectedInterDayStockData.length - 1; i >= this.interDayLongSma; i--){
      let longSma: number = 0
      for(let j = 0; j < this.interDayLongSma; j++){
        longSma += this.selectedInterDayStockData[i - j].close
      }
      this.listOfLast200Days.unshift({stockName: this.selectedStockName, close: this.selectedInterDayStockData[i].close, avg: longSma / this.interDayLongSma, date: new Date(this.selectedInterDayStockData[i].date).toLocaleDateString()})
    }
    for(let i = this.selectedInterDayStockData.length - 1; i >= this.interDayLongSma; i--){
      let mediumSma: number = 0
      for(let j = 0; j < this.interDayMediumSma; j++){
        mediumSma += this.selectedInterDayStockData[i - j].close
      }
      this.listOfLast40Days.unshift({stockName: this.selectedStockName, close: this.selectedInterDayStockData[i].close, avg: mediumSma / this.interDayMediumSma, date: new Date(this.selectedInterDayStockData[i].date).toLocaleDateString()})
    }
    for(let i = this.selectedInterDayStockData.length - 1; i >= this.interDayLongSma; i--){
      let shortSma: number = 0
      for(let j = 0; j < this.interDayShortSma; j++){
        shortSma += this.selectedInterDayStockData[i - j].close
      }
      this.listOfLast5Days.unshift({stockName: this.selectedStockName, close: this.selectedInterDayStockData[i].close, avg: shortSma / this.interDayShortSma, date: new Date(this.selectedInterDayStockData[i].date).toLocaleDateString()})
    }
    //let lengthOfLongArray = this.listOfLast200Days.length
    //this.listOfLast40Days = this.listOfLast40Days.slice(lengthOfLongArray * -1)
    //this.listOfLast5Days = this.listOfLast5Days.slice(lengthOfLongArray * -1)
  }
  updateChart() {
    this.stockChart.data.datasets[0].data = this.listOfLast200Days.map(e => e.close)
    this.stockChart.data.datasets[0].label = 'Actual'
    this.stockChart.data.datasets[1].data = this.listOfLast200Days.map(e => e.avg)
    this.stockChart.data.datasets[1].label = this.interDayLongSma
    this.stockChart.data.datasets[2].data = this.listOfLast40Days.map(e => e.avg)
    this.stockChart.data.datasets[2].label = this.interDayMediumSma
    this.stockChart.data.datasets[3].data = this.listOfLast5Days.map(e => e.avg)
    this.stockChart.data.datasets[3].label = this.interDayShortSma
    this.stockChart.data.labels = this.listOfLast200Days.map(e => e.date)
    this.stockChart.options.scales.y.max = this.getMaxForChart(this.listOfLast200Days)
    this.stockChart.options.scales.y.min = this.getMinForChart(this.listOfLast200Days)
    this.stockChart.update()
  }



  async ngOnInit() {
    Chart.register(annotationPlugin);
    Chart.register(...registerables)
    this.isLoading = true
    this.userAlgos = await dbAlgorithmListRepo.findFirst({ userId: remult.user?.id })
    this.listOfServerAlgos.push({
      name: 'SMA:50/200',
      isSelected: this.userAlgos!.sma200sma50
    })
    this.allHistory = await dbStockBasicHistoryRepo.find({ orderBy: { stockName: 'desc', date: 'asc' } })
    this.distinctStocks = this.allHistory.map(e => e.stockName).filter((v, i, a) => a.indexOf(v) === i)
    this.selectedStockName = this.distinctStocks[0]
    this.selectedInterDayStockData = this.allHistory.filter(e => e.stockName == this.selectedStockName)
    this.interDayLongSma = 200
    this.interDayMediumSma = 40
    this.interDayShortSma = 5
    this.createOrUpdateChart()
    this.runSimulation()
    await this.getStockHistoricalData()
    this.isLoading = false;

  }
}
