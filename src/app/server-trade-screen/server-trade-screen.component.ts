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
  worker = new Worker('../../Workers/intraDaySimulationWorker.js')
  interDayLongSma: number = 0;
  interDayMediumSma: number = 0
  interDayShortSma: number = 0
  

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
    this.listOfLastHour = []
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
    this.listOfLast5Minutes.push(...tempStock5Minutes)
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
    this.updateChartIntraDay()
    this.calculateBuyAndSellPointsIntraDay()
    this.updateGraphBuyAndSellPointsIntraDay()
    this.calculateTotalProfit()
  }
  async onRunEntireSimulation() {
    this.isLoading = true;
    if (this.intraDayChecked) {
      await this.runEntireSimulationIntraDay()
    }
    else {
      this.runEntireSimulationInterDay()
    }

    this.isLoading = false
  }
  listOfChildSmaValues: smaChildLists[] = []
  listOfLongSmaValues: smaLists[] = []
  runEntireSimulationIntraDay() {
    this.worker.postMessage(this.stockDataForSelectedDay)
    this.worker.onmessage = (message: any) => {
      console.log(message.data.length)
    }
    let listOfProfits = []
    let mapOfLongSmaValues = new Map<number, sma200Array[]>()
    let mapOfMediumSmaValues = new Map<string, sma200Array[]>()
    let mapOfShortSmaValues = new Map<string, sma200Array[]>()
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
              if (mapOfMediumSmaValues.get(JSON.stringify({ long: m * 60, value: n * 60 })) === undefined) {
                let listOfLastMediumResult = this.calculateIntraDayMediumSma(m * 60, n * 60)
                mapOfMediumSmaValues.set(
                  JSON.stringify({ long: m * 60, value: n * 60 }),
                  listOfLastMediumResult
                )
              }
              for (let p = 1; p <= 10; p++) {
                if (mapOfShortSmaValues.get(JSON.stringify({ long: m * 60, value: p * 60 })) === undefined) {
                  let listOfLastShortResult = this.calculateIntraDayShortSma(m * 60, p * 60)
                  mapOfShortSmaValues.set(
                    JSON.stringify({ long: m * 60, value: p * 60 }),
                    listOfLastShortResult
                  )
                }
                let orderLocations = this.calculateBuyAndSellPointsIntraDayNew(mapOfLongSmaValues.get(m * 60)!, mapOfMediumSmaValues.get(JSON.stringify({ long: m * 60, value: n * 60 }))!, mapOfShortSmaValues.get(JSON.stringify({ long: m * 60, value: p * 60 }))!, Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3)))
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
    console.log(listOfProfits.length)
    console.log(listOfProfits.sort((a, b) => b.profit - a.profit).slice(0, 50))
    this.topAlgos = listOfProfits.sort((a, b) => b.profit - a.profit).slice(0, 5)
    this.buyGutter = this.topAlgos[0].buyBuffer
    this.sellGutter = this.topAlgos[0].sellBuffer
    this.check200Gutter = this.topAlgos[0].checkBuffer
    this.intraDayLongSma = this.topAlgos[0].smaLong
    this.intraDayMediumSma = this.topAlgos[0].smaMedium
    this.intraDayShortSma = this.topAlgos[0].smaShort
    this.calculateIntraDaySma()
    this.runSimulationIntraDay()

  }

  

  async runEntireSimulationIntraDayAllDays() {
    //let listOfProfitIntraDayAllDays: bufferAlgo[] = new Array(this.distinctDates.length * 4200000)
    this.listOfProfits.length = 0
    let mapOfLongSmaValues = new Map<number, sma200Array[]>()
    let mapOfMediumSmaValues = new Map<smaListLookup, sma200Array[]>()
    let mapOfShortSmaValues = new Map<smaListLookup, sma200Array[]>()
    let filteredLongSmaList: sma200Array[] | undefined = []
    let filteredMediumSmaList: sma200Array[] | undefined = []
    let filteredShortSmaValue: sma200Array[] | undefined = []
    for (let h = 0; h < this.distinctDates.length; h++) {
      this.selectedDate = this.distinctDates[h]
      await this.updateStockChartData(this.selectedDate)
      this.listOfChildSmaValues.length = 0
      this.listOfLongSmaValues.length = 0
      for (let i = 1; i <= 20; i++) {
        this.buyGutter = Number((i * .001).toPrecision(3))
        for (let j = 1; j <= 20; j++) {
          this.sellGutter = Number((j * .001).toPrecision(3))
          for (let k = 1; k <= 30; k++) {
            this.check200Gutter = Number((k * .001).toPrecision(3))
            for (let m = 60; m <= 90; m += 5) {
              this.intraDayLongSma = (m * 60)
              filteredLongSmaList = mapOfLongSmaValues.get(this.intraDayLongSma)
              if (filteredLongSmaList == undefined) {
                //this.calculateIntraDayLongSma()
                mapOfLongSmaValues.set(
                  this.intraDayLongSma,
                  this.listOfLastHour
                )
              }
              else {
                this.listOfLastHour = filteredLongSmaList
                //filteredLongSmaList.length = 0
              }


              for (let n = 20; n <= 40; n += 5) {
                this.intraDayMediumSma = (n * 60)
                filteredMediumSmaList = mapOfMediumSmaValues.get({ long: this.intraDayLongSma, value: this.intraDayMediumSma })
                if (filteredMediumSmaList == undefined) {
                  //this.calculateIntraDayMediumSma()
                  mapOfMediumSmaValues.set({ long: this.intraDayLongSma, value: this.intraDayMediumSma }, this.listOfLast30Minutes)
                }
                else {
                  this.listOfLast30Minutes = filteredMediumSmaList
                  //filteredMediumSmaList.length = 0
                }



                for (let p = 1; p <= 10; p++) {
                  this.intraDayShortSma = (p * 60)
                  this.bankTotal = 500
                  this.orderLocations.length = 0
                  this.totalPofit = 0
                  filteredShortSmaValue = mapOfShortSmaValues.get({ long: this.intraDayLongSma, value: this.intraDayShortSma })
                  if (filteredShortSmaValue == undefined) {
                    //this.calculateIntraDayShortSma()
                    mapOfShortSmaValues.set({ long: this.intraDayLongSma, value: this.intraDayShortSma }, this.listOfLast5Minutes)
                  }
                  else {
                    this.listOfLast5Minutes = filteredShortSmaValue
                    //filteredShortSmaValue.length = 0
                  }
                  this.calculateBuyAndSellPointsIntraDay()
                  this.calculateTotalProfit()
                  this.listOfProfits.push({
                    buyBuffer: this.buyGutter,
                    sellBuffer: this.sellGutter,
                    checkBuffer: this.check200Gutter,
                    smaLong: this.intraDayLongSma,
                    smaMedium: this.intraDayMediumSma,
                    smaShort: this.intraDayShortSma,
                    profit: this.totalPofit,
                    numberOfTrades: this.orderLocations.length
                  })
                  //this.listOfLast5Minutes.length = 0
                }
                //this.listOfLast30Minutes.length = 0
              }

              //this.listOfLastHour.length = 0
            }

          }

        }
        console.log('finished outer loop iteration')
      }
      this.stockDataForSelectedDay.length = 0
      this.listOfChildSmaValues.length = 0
      this.listOfLongSmaValues.length = 0
      //await dbListOfProfitsRepo.insert(this.listOfProfits)
      //this.listOfProfits.length = 0
    }
    //this.listOfProfits = await dbListOfProfitsRepo.find()
    console.log(this.listOfProfits.length)
    console.log('here starting getting distincts')
    let distinctBuys = this.listOfProfits.map(e => e.buyBuffer).filter((v, i, a) => a.indexOf(v) === i)
    let distinctSells = this.listOfProfits.map(e => e.sellBuffer).filter((v, i, a) => a.indexOf(v) === i)
    let distinctChecks = this.listOfProfits.map(e => e.checkBuffer).filter((v, i, a) => a.indexOf(v) === i)
    let distinctLongSma = this.listOfProfits.map(e => e.smaLong).filter((v, i, a) => a.indexOf(v) === i)
    let distinctMediumSma = this.listOfProfits.map(e => e.smaMedium).filter((v, i, a) => a.indexOf(v) === i)
    let distinctShortSma = this.listOfProfits.map(e => e.smaShort).filter((v, i, a) => a.indexOf(v) === i)

    let distinctBuysLength = distinctBuys.length
    let distinctSellsLength = distinctSells.length
    let distinctChecksLength = distinctChecks.length
    let distinctLongSmaLength = distinctLongSma.length
    let distinctMediumSmaLength = distinctMediumSma.length
    let distinctShortSmaLength = distinctShortSma.length


    let listOfAverages: bufferAlgo[] = []
    let performers: bufferAlgo[] = []
    console.log('starting filtering')
    for (let i = 0; i < distinctBuysLength; i++) {
      let filteredBuys = this.listOfProfits.filter(e => e.buyBuffer == distinctBuys[i])
      for (let j = 0; j < distinctSellsLength; j++) {
        let filteredSell = filteredBuys.filter(e => e.sellBuffer == distinctSells[j])
        for (let k = 0; k < distinctChecksLength; k++) {
          let filteredCheck = filteredSell.filter(e => e.checkBuffer == distinctChecks[k])
          for (let m = 0; m < distinctLongSmaLength; m++) {
            let filteredLongSma = filteredCheck.filter(e => e.smaLong == distinctLongSma[m])
            for (let n = 0; n < distinctMediumSmaLength; n++) {
              let filteredMediumSma = filteredLongSma.filter(e => e.smaMedium == distinctMediumSma[n])
              for (let p = 0; p < distinctShortSmaLength; p++) {
                let filteredShortSma = filteredMediumSma.filter(e => e.smaShort == distinctShortSma[p])
                //performers.push(...this.listOfProfits.filter(e => e.buyBuffer == distinctBuys[i] && e.sellBuffer == distinctSells[j] && e.checkBuffer == distinctChecks[k]))
                performers.push(...filteredShortSma)
                let avgProfit = performers.reduce((sum, val) => sum + val.profit, 0) / performers.length
                let avgNumTrades = performers.reduce((sum, val) => sum + val.numberOfTrades, 0) / performers.length
                listOfAverages.push({
                  buyBuffer: filteredShortSma[0].buyBuffer,
                  sellBuffer: filteredShortSma[0].sellBuffer,
                  checkBuffer: filteredShortSma[0].checkBuffer,
                  smaLong: filteredShortSma[0].smaLong,
                  smaMedium: filteredShortSma[0].smaMedium,
                  smaShort: filteredShortSma[0].smaShort,
                  profit: avgProfit,
                  numberOfTrades: avgNumTrades
                })
                performers.length = 0
              }
            }
          }
        }

      }
    }
    this.topAlgosAllDays = listOfAverages.sort((a, b) => b.profit - a.profit).slice(0, 5)
    console.log('done')
    console.log(this.topAlgosAllDays)
    //this.buyGutter = this.topAlgos[0].buyBuffer
    //this.sellGutter = this.topAlgos[0].sellBuffer
    //this.runSimulationIntraDay()

  }
  async runEntireSimulationIntraDayAllDays2() {
    let listOfProfits = []
    let mapOfLongSmaValues = new Map<string, sma200Array[]>()
    let mapOfMediumSmaValues = new Map<string, sma200Array[]>()
    let mapOfShortSmaValues = new Map<string, sma200Array[]>()
    let mapOfStockDayData = new Map<string, DbStockHistoryData[]>()
    let allOfStockData = await dbStockHistoryDataRepo.find({where:{stockName: this.selectedStockName}, orderBy: {time: 'asc'}})
    for(let g = 0; g < this.distinctDates.length; g++){
      let filteredData = allOfStockData.filter(e => e.date == this.distinctDates[g])
      mapOfStockDayData.set(this.distinctDates[g], filteredData)
    }
    for (let h = 0; h < 6; h++) {
      let selectedDate = this.distinctDates[h]
      let selectedStockData = await this.updateStockChartDataNew(selectedDate)
      for (let i = 1; i <= 20; i++) {
        for (let j = 1; j <= 20; j++) {
          console.time('sell')
          for (let k = 1; k <= 30; k++) {
            for (let m = 60; m <= 90; m += 5) {
              for (let n = 20; n <= 40; n += 5) {
                for (let p = 1; p <= 10; p++) {
                  for(let x = 0; x < this.distinctDates.length; x++){

                  }
                  if (mapOfLongSmaValues.get(JSON.stringify({date: selectedDate, long: (m * 60)})) === undefined) {
                    let listOfLastHourResult = this.calculateIntraDayLongSmaAllDays(m * 60, selectedStockData)
                    mapOfLongSmaValues.set(
                      JSON.stringify({date: selectedDate, long: (m * 60)}),
                      listOfLastHourResult
                    )
                  }
                  if (mapOfMediumSmaValues.get(JSON.stringify({ date: selectedDate, long: m * 60, value: n * 60 })) === undefined) {
                    let listOfLastMediumResult = this.calculateIntraDayMediumSmaAllDays(m * 60, n * 60, selectedStockData)
                    mapOfMediumSmaValues.set(
                      JSON.stringify({ date: selectedDate, long: m * 60, value: n * 60 }),
                      listOfLastMediumResult
                    )
                  }
                  if (mapOfShortSmaValues.get(JSON.stringify({ date: selectedDate, long: m * 60, value: p * 60 })) === undefined) {
                    let listOfLastShortResult = this.calculateIntraDayShortSmaAllDays(m * 60, p * 60, selectedStockData)
                    mapOfShortSmaValues.set(
                      JSON.stringify({ date: selectedDate, long: m * 60, value: p * 60 }),
                      listOfLastShortResult
                    )
                  }
                  let orderLocations = this.calculateBuyAndSellPointsIntraDayNew(mapOfLongSmaValues.get(JSON.stringify({ date: selectedDate, long: (m * 60)}))!, mapOfMediumSmaValues.get(JSON.stringify({ date: selectedDate, long: m * 60, value: n * 60 }))!, mapOfShortSmaValues.get(JSON.stringify({ date: selectedDate, long: m * 60, value: p * 60 }))!, Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3)))
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
      console.log('finsihed date')
    }
    /* let distinctBuys = [.001,.002,.003,.004,.005,.006,.007,.008,.009,.010,.011,.012,.013,.014,.015,.016,.017,.018,.019,.020]
    let distinctSells = [.001,.002,.003,.004,.005,.006,.007,.008,.009,.010,.011,.012,.013,.014,.015,.016,.017,.018,.019,.020]
    let distinctChecks = [.001,.002,.003,.004,.005,.006,.007,.008,.009,.010,.011,.012,.013,.014,.015,.016,.017,.018,.019,.020,.021,.022,.023,.024,.025,.026,.027,.028,.029,.030]
    let distinctLongs = [60, 65, 70, 75, 80, 85, 90]
    let distinctMediums = [20, 25, 30, 35, 40]
    let distinctShorts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    for(let i = 0; i < distinctBuys.length; i++){
      for(let j = 0; j < distinctSells.length; j++){
        for(let k = 0; k < distinctChecks.length; k++){
          for(let)
        }
      }
    } */
    console.log(listOfProfits.length)
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
    this.calculateSma()
    this.updateChart()
    this.calculateBuyAndSellPoints()
    this.updateGraphBuyAndSellPoints()
    this.calculateTotalProfit()
  }
  runEntireSimulationInterDay() {
    let listOfProfits = []
    let mapOfLongSmaValues = new Map<number, sma200Array[]>()
    let mapOfMediumSmaValues = new Map<string, sma200Array[]>()
    let mapOfShortSmaValues = new Map<string, sma200Array[]>()
    for (let i = 1; i < 20; i++) {
      for (let j = 1; j < 20; j++) {
        console.time('inter sell')
        for (let k = 1; k < 30; k++) {
          for(let m = 150; m <= 250; m += 5){
            if (mapOfLongSmaValues.get(m) === undefined) {
              let listOfLongResult = this.calculateInterDayLongSma(m)
              mapOfLongSmaValues.set(
                m,
                listOfLongResult
              )
            }
            for(let n = 30; n <= 80; n += 5){
              if (mapOfMediumSmaValues.get(JSON.stringify({long: m, value: n})) === undefined) {
                let listOfMediumResult = this.calculateInterDayMediumSma(m, n)
                mapOfMediumSmaValues.set(
                  JSON.stringify({long: m, value: n}),
                  listOfMediumResult
                )
              }
              for(let p = 1; p <= 15; p++){
                if (mapOfShortSmaValues.get(JSON.stringify({long: m, value: p})) === undefined) {
                  let listOfShortResult = this.calculateInterDayShortSma(m, p)
                  mapOfShortSmaValues.set(
                    JSON.stringify({long: m, value: p}),
                    listOfShortResult
                  )
                }

                let orderLocations = this.calculateBuyAndSellPointsIntraDayNew(mapOfLongSmaValues.get(m)!, mapOfMediumSmaValues.get(JSON.stringify({ long: m, value: n }))!, mapOfShortSmaValues.get(JSON.stringify({ long: m, value: p }))!, Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3)))
                let totalProfit = this.calculateTotalProfitNew(orderLocations)

                listOfProfits.push({
                  buyBuffer: Number((i * .001).toPrecision(3)),
                  sellBuffer: Number((j * .001).toPrecision(3)),
                  checkBuffer: Number((k * .001).toPrecision(3)),
                  smaLong: m,
                  smaMedium: n,
                  smaShort: p,
                  profit: totalProfit,
                  numberOfTrades: orderLocations.length
                })
              }
            }
          }
        }
        console.timeEnd('inter sell')
      }
    }
    this.topAlgos = listOfProfits.sort((a, b) => b.profit - a.profit).slice(0, 5)
    console.log(this.topAlgos)
    this.buyGutter = this.topAlgos[0].buyBuffer
    this.sellGutter = this.topAlgos[0].sellBuffer
    this.check200Gutter = this.topAlgos[0].checkBuffer
    this.interDayLongSma = this.topAlgos[0].smaLong
    this.interDayMediumSma = this.topAlgos[0].smaMedium
    this.interDayShortSma = this.topAlgos[0].smaShort
    this.runSimulation()
  }
  calculateInterDayShortSma(longValue: number, shortValue: number) {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = longValue - shortValue; i < longValue; i++) {
      windowSum += this.selectedInterDayStockData[i].close;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[longValue].close, avg: (windowSum / shortValue), date: new Date(this.selectedInterDayStockData[longValue].date).toLocaleDateString() }); // Push the average of the first window

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
    returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[longValue].close, avg: (windowSum / mediumValue), date: new Date(this.selectedInterDayStockData[longValue].date).toLocaleDateString() }); // Push the average of the first window

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
        if ((((this.listOfLast5Days[i].avg - this.listOfLast40Days[i].avg) / this.listOfLast40Days[i].avg) < (this.buyGutter * -1)) && ((Math.abs(this.listOfLast5Days[i].avg - this.listOfLast200Days[i].avg) / this.listOfLast200Days[i].avg) < this.check200Gutter)) {
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
        tempStock200.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[j].close, avg: last200Avg, date: new Date(this.selectedInterDayStockData[j].date).toLocaleTimeString() })
      }
      let tempStock40: sma200Array[] = []
      for (let j = this.interDayLongSma; j < this.selectedInterDayStockData.length; j++) {
        let last50Price: number = 0;
        for (let k = 0; k < this.interDayMediumSma; k++) {
          last50Price += this.selectedInterDayStockData[j - k].close
        }
        let last200Avg = last50Price / this.interDayMediumSma
        tempStock40.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[j].close, avg: last200Avg, date: new Date(this.selectedInterDayStockData[j].date).toLocaleTimeString() })
      }
      let tempStock5: sma200Array[] = []
      for (let j = this.interDayLongSma; j < this.selectedInterDayStockData.length; j++) {
        let last50Price: number = 0;
        for (let k = 0; k < this.interDayShortSma; k++) {
          last50Price += this.selectedInterDayStockData[j - k].close
        }
        let last200Avg = last50Price / this.interDayShortSma
        tempStock5.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[j].close, avg: last200Avg, date: new Date(this.selectedInterDayStockData[j].date).toLocaleTimeString() })
      }
      this.listOfLast200Days.push(...tempStock200)
      this.listOfLast40Days.push(...tempStock40)
      this.listOfLast5Days.push(...tempStock5)
    
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
