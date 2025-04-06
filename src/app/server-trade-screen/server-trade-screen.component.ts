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
import { TradeHistoryDetailComponent } from '../trade-history-detail/trade-history-detail.component';
import { MatTableModule } from '@angular/material/table';
import { DbListOfProfits, dbListOfProfitsRepo } from '../../shared/tasks/dbListOfProfits';

type serverAlgos = {
  name: string;
  isSelected: boolean;
}
type sma200Array = {
  stockName: string;
  close: number;
  avg: number;
  //date: string;
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

  async saveAlgos() {
    await dbAlgorithmListRepo.save({ ...this.userAlgos, sma200sma50: this.listOfServerAlgos[0].isSelected })
  }
  getStockDisplay() {
    this.selectedStockLast200 = this.listOfLast200Days.filter(e => e.stockName == this.selectedStockName)
    this.selectedStockLast40 = this.listOfLast40Days.filter(e => e.stockName == this.selectedStockName)
    this.selectedStockLast5 = this.listOfLast5Days.filter(e => e.stockName == this.selectedStockName)
    console.log(this.selectedStockLast200)
  }
  async onSelectedStockChange(event: any) {
    if (event.isUserInput == true) {
      this.selectedStockName = event.source.value
      if (!this.intraDayChecked) {
        this.isLoading = true
        this.intraDayLongSma = 3600;
        this.intraDayMediumSma = 1800;
        this.intraDayShortSma = 300
        this.getStockDisplay()
        this.updateChart()
        this.runSimulation()
        this.isLoading = false
      }
      else {
        this.isLoading = true
        await this.getStockHistoricalData()
        await this.updateStockChartData()
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

        labels: this.selectedStockLast200.map(e => ''),

        datasets: [
          {
            label: 'Actual',
            data: this.selectedStockLast200.map(e => e.close),
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
            data: this.selectedStockLast200.map(e => e.avg),
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
            data: this.selectedStockLast40.map(e => e.avg),
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
            data: this.selectedStockLast5.map(e => e.avg),
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
    if (buySell == 'Buy') {
      this.bankTotal -= arr.close
      this.orderLocations.push({ buySell: 'Buy', date: '', price: arr.close })
    }
    else {
      this.bankTotal += arr.close
      this.orderLocations.push({ buySell: 'Sell', date: '', price: arr.close })
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
      await this.updateStockChartData()
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
      this.getStockDisplay()
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
    await this.runEntireSimulationIntraDayAllDays()
    this.isLoading = false
  }
  /* Intra Day */
  async onSelectedDateChange(event: any) {
    if (event.isUserInput == true) {
      this.isLoading = true
      this.selectedDate = event.source.value
      await this.updateStockChartData()
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
  async updateStockChartData() {
    this.stockDataForSelectedDay = await dbStockHistoryDataRepo.find({ where: { stockName: this.selectedStockName, date: this.selectedDate }, orderBy: { time: 'asc' } })
    this.stockDataForSelectedDay = this.stockDataForSelectedDay.filter(e => reusedFunctions.isWithinTradingHoursLocal(e.time))
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
      tempStockHour.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: lastHourAvg })
    }
    let tempStock30Minutes: sma200Array[] = []
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      let last30MinutesPrice: number = 0;
      for (let k = 0; k < this.intraDayMediumSma; k++) {
        last30MinutesPrice += this.stockDataForSelectedDay[j - k].stockPrice
      }
      let last30MinutesAvg = last30MinutesPrice / this.intraDayMediumSma
      tempStock30Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: last30MinutesAvg })
    }
    let tempStock5Minutes: sma200Array[] = []
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      let last5MinutesPrice: number = 0;
      for (let k = 0; k < this.intraDayShortSma; k++) {
        last5MinutesPrice += this.stockDataForSelectedDay[j - k].stockPrice
      }
      let last5MinutesAvg = last5MinutesPrice / this.intraDayShortSma
      tempStock5Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: last5MinutesAvg })
    }
    this.listOfLastHour.push(...tempStockHour)
    this.listOfLast30Minutes.push(...tempStock30Minutes)
    this.listOfLast5Minutes.push(...tempStock5Minutes)
  }
  calculateIntraDayShortSma() {
    this.listOfLast5Minutes.length = 0
    //let tempStock5Minutes: sma200Array[] = []
    /*  for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
       let last5MinutesPrice: number = 0;
       for (let k = 0; k < this.intraDayShortSma; k++) {
         last5MinutesPrice += this.stockDataForSelectedDay[j - k].stockPrice
       }
       //let last5MinutesAvg = last5MinutesPrice / this.intraDayShortSma
       this.listOfLast5Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: (last5MinutesPrice / this.intraDayShortSma) })
       //tempStock5Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: last5MinutesAvg, date: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
     } */
    //this.listOfLast5Minutes.push(...tempStock5Minutes)
    let windowSum: number = 0;
    for (let i = this.intraDayLongSma - this.intraDayShortSma; i < this.intraDayShortSma; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    this.listOfLast5Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma].stockPrice, avg: (windowSum / this.intraDayShortSma) }); // Push the average of the first window

    // Step 3: Slide the window across the array
    for (let i = this.intraDayLongSma; i < this.stockDataForSelectedDay.length; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - this.intraDayShortSma].stockPrice; // Add new element, remove old element
      this.listOfLast5Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: (windowSum / this.intraDayShortSma) }); // Push the new average
    }
  }
  calculateIntraDayMediumSma() {
    this.listOfLast30Minutes.length = 0
    //let tempStock30Minutes: sma200Array[] = []
    /* for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      let last30MinutesPrice: number = 0;
      for (let k = 0; k < this.intraDayMediumSma; k++) {
        last30MinutesPrice += this.stockDataForSelectedDay[j - k].stockPrice
      }
      //let last30MinutesAvg = last30MinutesPrice / this.intraDayMediumSma
      this.listOfLast30Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: (last30MinutesPrice / this.intraDayMediumSma) })
      //tempStock30Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: last30MinutesAvg, date: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    } */


    let windowSum: number = 0;
    for (let i = this.intraDayLongSma - this.intraDayMediumSma; i < this.intraDayLongSma; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    this.listOfLast30Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma].stockPrice, avg: (windowSum / this.intraDayMediumSma) }); // Push the average of the first window

    // Step 3: Slide the window across the array
    for (let i = this.intraDayLongSma; i < this.stockDataForSelectedDay.length; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - this.intraDayMediumSma].stockPrice; // Add new element, remove old element
      this.listOfLast30Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: (windowSum / this.intraDayMediumSma) }); // Push the new average
    }
    //this.listOfLast30Minutes.push(...tempStock30Minutes)
  }
  calculateIntraDayLongSma() {
    this.listOfLastHour.length = 0
    //let tempStockHour: sma200Array[] = []
    /* for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      let lastHourPrice: number = 0;
      for (let k = 0; k < this.intraDayLongSma; k++) {
        lastHourPrice += this.stockDataForSelectedDay[j - k].stockPrice
      }
      //let lastHourAvg = lastHourPrice / this.intraDayLongSma
      this.listOfLastHour.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: (lastHourPrice / this.intraDayLongSma) })
      //tempStockHour.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: lastHourAvg, date: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    } */
    let windowSum: number = 0;
    for (let i = 0; i < this.intraDayLongSma; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    this.listOfLastHour.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma].stockPrice, avg: (windowSum / this.intraDayLongSma) }); // Push the average of the first window

    // Step 3: Slide the window across the array
    for (let i = this.intraDayLongSma; i < this.stockDataForSelectedDay.length; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - this.intraDayLongSma].stockPrice; // Add new element, remove old element
      this.listOfLastHour.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: (windowSum / this.intraDayLongSma) }); // Push the new average
    }
    //this.listOfLastHour.push(...tempStockHour)
  }
  updateChartIntraDay() {
    this.stockChart.data.datasets[0].data = this.listOfLastHour.map(e => e.close)
    this.stockChart.data.datasets[0].label = 'Actual'
    this.stockChart.data.datasets[1].data = this.listOfLastHour.map(e => e.avg)
    this.stockChart.data.datasets[1].label = 'Hour'
    this.stockChart.data.datasets[2].data = this.listOfLast30Minutes.map(e => e.avg)
    this.stockChart.data.datasets[2].label = '30 Minutes'
    this.stockChart.data.datasets[3].data = this.listOfLast5Minutes.map(e => e.avg)
    this.stockChart.data.datasets[3].label = '5 Minutes'
    this.stockChart.data.labels = this.listOfLastHour.map(e => 'e.date')
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
  async runEntireSimulationIntraDay() {
    this.listOfChildSmaValues = []
    this.listOfLongSmaValues = []
    this.listOfProfits = []
    for (let i = 1; i <= 20; i++) {
      this.buyGutter = i * .001
      this.buyGutter = Number(this.buyGutter.toPrecision(3))
      for (let j = 1; j <= 20; j++) {
        this.sellGutter = j * .001
        this.sellGutter = Number(this.sellGutter.toPrecision(3))
        for (let k = 1; k <= 30; k++) {
          this.check200Gutter = k * .001;
          this.check200Gutter = Number(this.check200Gutter.toPrecision(3))
          for (let m = 60; m <= 90; m += 5) {
            this.intraDayLongSma = (m * 60)
            let filteredLongSmaList = this.listOfLongSmaValues.filter(e => e.value == this.intraDayLongSma)
            if (filteredLongSmaList.length == 0) {
              this.calculateIntraDayLongSma()
              this.listOfLongSmaValues.push({
                value: this.intraDayLongSma,
                sma: this.listOfLastHour
              })
            }
            else {
              this.listOfLastHour = filteredLongSmaList[0].sma
            }

            for (let n = 20; n <= 40; n += 5) {
              this.intraDayMediumSma = (n * 60)
              let filteredMediumSmaList = this.listOfChildSmaValues.filter(e => e.type == 'Medium' && e.longValue == this.intraDayLongSma && e.value == this.intraDayMediumSma)
              if (filteredMediumSmaList.length == 0) {
                this.calculateIntraDayMediumSma()
                this.listOfChildSmaValues.push({
                  longValue: this.intraDayLongSma,
                  value: this.intraDayMediumSma,
                  type: 'Medium',
                  sma: this.listOfLast30Minutes
                })
              }
              else {
                this.listOfLast30Minutes = filteredMediumSmaList[0].sma
              }


              for (let p = 1; p <= 10; p++) {
                this.intraDayShortSma = (p * 60)
                this.bankTotal = 500
                this.orderLocations = []
                this.totalPofit = 0
                let filteredShortSmaValue = this.listOfChildSmaValues.filter(e => e.type == 'Short' && e.longValue == this.intraDayLongSma && e.value == this.intraDayShortSma)
                if (filteredShortSmaValue.length == 0) {
                  this.calculateIntraDayShortSma()
                  this.listOfChildSmaValues.push({
                    type: 'Short',
                    longValue: this.intraDayLongSma,
                    value: this.intraDayShortSma,
                    sma: this.listOfLast5Minutes
                  })
                }
                else {
                  this.listOfLast5Minutes = filteredShortSmaValue[0].sma
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
                this.listOfLast5Minutes.length = 0
              }
              this.listOfLast30Minutes.length = 0
            }

            this.listOfLastHour.length = 0
          }

        }

      }
      console.log('finished outer loop iteration')
    }
    console.log(this.listOfProfits.length)
    console.log(this.listOfProfits[0])
    this.topAlgos = this.listOfProfits.sort((a, b) => a.profit - b.profit).slice(0, 5)
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
      await this.updateStockChartData()
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
                this.calculateIntraDayLongSma()
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
                  this.calculateIntraDayMediumSma()
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
                    this.calculateIntraDayShortSma()
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
    this.listOfProfits.length = 0
    let filteredLongSmaList: sma200Array[] | undefined = []
    let filteredMediumSmaList: sma200Array[] | undefined = []
    let filteredShortSmaList: sma200Array[] | undefined = []
    let mapOfEachDayStockData = new Map<string, DbStockHistoryData[]>()
    let mapOfLongSmaValues = new Map<smaDayListLongLookup, sma200Array[]>()
    let mapOfMediumSmaValues = new Map<smaDayListMediumShortLookup, sma200Array[]>()
    let mapOfShortSmaValues = new Map<smaDayListMediumShortLookup, sma200Array[]>()
    let allStockDaysData: DbStockHistoryData[] = []
    allStockDaysData = await dbStockHistoryDataRepo.find({ where: { stockName: this.selectedStockName }, orderBy: { date: 'asc' } })
    for (let i = 0; i < this.distinctDates.length; i++) {
      mapOfEachDayStockData.set(this.distinctDates[i], allStockDaysData.filter(e => e.date == this.distinctDates[i] && reusedFunctions.isWithinTradingHoursLocal(e.time)))
    }
    let listOfSingleComboAllDaysResults: bufferAlgo[] = []
    for (let i = 1; i <= 20; i++) {
      this.buyGutter = Number((i * .001).toPrecision(3))
      for (let j = 1; j <= 20; j++) {
        this.sellGutter = Number((j * .001).toPrecision(3))
        for (let k = 1; k <= 30; k++) {
          this.check200Gutter = Number((k * .001).toPrecision(3))
          for (let m = 60; m <= 90; m += 5) {
            this.intraDayLongSma = (m * 60)
            for (let n = 20; n <= 40; n += 5) {
              this.intraDayMediumSma = (n * 60)
              for (let p = 1; p <= 10; p++) {
                this.intraDayShortSma = (p * 60)
                for (let h = 0; h < this.distinctDates.length; h++) {
                  this.stockDataForSelectedDay = mapOfEachDayStockData.get(this.distinctDates[h])!
                  this.bankTotal = 500
                  this.orderLocations.length = 0
                  this.totalPofit = 0
                  filteredLongSmaList = mapOfLongSmaValues.get({ day: this.distinctDates[h], longValue: this.intraDayLongSma })
                  if (filteredLongSmaList == undefined) {
                    this.calculateIntraDayLongSma()
                    mapOfLongSmaValues.set({ day: this.distinctDates[h], longValue: this.intraDayLongSma }, this.listOfLastHour)
                  }
                  else {
                    this.listOfLastHour = filteredLongSmaList
                  }
                  filteredMediumSmaList = mapOfMediumSmaValues.get({ day: this.distinctDates[h], longValue: this.intraDayLongSma, value: this.intraDayMediumSma })
                  if (filteredMediumSmaList == undefined) {
                    this.calculateIntraDayMediumSma()
                    mapOfMediumSmaValues.set({ day: this.distinctDates[h], longValue: this.intraDayLongSma, value: this.intraDayMediumSma }, this.listOfLast30Minutes)
                  }
                  else {
                    this.listOfLast30Minutes = filteredMediumSmaList
                  }
                  filteredShortSmaList = mapOfShortSmaValues.get({ day: this.distinctDates[h], longValue: this.intraDayLongSma, value: this.intraDayShortSma })
                  if (filteredShortSmaList == undefined) {
                    this.calculateIntraDayShortSma()
                    mapOfShortSmaValues.set({ day: this.distinctDates[h], longValue: this.intraDayLongSma, value: this.intraDayShortSma }, this.listOfLast5Minutes)
                  }
                  else {
                    this.listOfLast5Minutes = filteredShortSmaList
                  }

                  this.calculateBuyAndSellPointsIntraDay()
                  this.calculateTotalProfit()
                  listOfSingleComboAllDaysResults.push({
                    buyBuffer: this.buyGutter,
                    sellBuffer: this.sellGutter,
                    checkBuffer: this.check200Gutter,
                    smaLong: this.intraDayLongSma,
                    smaMedium: this.intraDayMediumSma,
                    smaShort: this.intraDayShortSma,
                    profit: this.totalPofit,
                    numberOfTrades: this.orderLocations.length
                  })

                }
                //calc avg here
                console.log('done with days calculating its averages')
                let avgProfit = listOfSingleComboAllDaysResults.reduce((sum, val) => sum + val.profit, 0) / listOfSingleComboAllDaysResults.length
                let avgNumTrades = listOfSingleComboAllDaysResults.reduce((sum, val) => sum + val.numberOfTrades, 0) / listOfSingleComboAllDaysResults.length
                if (this.listOfProfits.length < 10) {
                  this.listOfProfits.push({
                    buyBuffer: this.buyGutter,
                    sellBuffer: this.sellGutter,
                    checkBuffer: this.check200Gutter,
                    smaLong: this.intraDayShortSma,
                    smaMedium: this.intraDayMediumSma,
                    smaShort: this.intraDayLongSma,
                    profit: avgProfit,
                    numberOfTrades: avgNumTrades
                  })
                  this.listOfProfits.sort((a, b) => b.profit - a.profit)
                }
                else {
                  if (avgProfit > this.listOfProfits[this.listOfProfits.length - 1].profit) {
                    this.listOfProfits.push({
                      buyBuffer: this.buyGutter,
                      sellBuffer: this.sellGutter,
                      checkBuffer: this.check200Gutter,
                      smaLong: this.intraDayShortSma,
                      smaMedium: this.intraDayMediumSma,
                      smaShort: this.intraDayLongSma,
                      profit: avgProfit,
                      numberOfTrades: avgNumTrades
                    })
                    this.listOfProfits.sort((a, b) => b.profit - a.profit)
                  }
                }


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
    console.log('done')
    console.log(this.listOfProfits)

  }
  calculateBuyAndSellPointsIntraDay() {
    let buyOrSell = 'Buy'
    console.log(this.listOfLast5Minutes)
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
        //this.listOfLastHour.findIndex(x => x.date == this.orderLocations[i].date)
        xMin: 0,
        xMax: 0,
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
    this.calculateBuyAndSellPoints()
    this.updateGraphBuyAndSellPoints()
    this.calculateTotalProfit()
  }
  runEntireSimulationInterDay() {
    this.listOfProfits = []
    for (let i = 1; i < 20; i++) {
      this.buyGutter = i * .01
      this.buyGutter = Number(this.buyGutter.toPrecision(3))
      for (let j = 1; j < 20; j++) {
        this.sellGutter = j * .01
        this.sellGutter = Number(this.sellGutter.toPrecision(3))
        for (let k = 1; k < 30; k++) {
          this.check200Gutter = .01 + (k * .001)
          this.check200Gutter = Number(this.check200Gutter.toPrecision(3))
          this.bankTotal = 500
          this.orderLocations = []
          this.totalPofit = 0
          this.calculateBuyAndSellPoints()
          this.calculateTotalProfit()
          this.listOfProfits.push({
            buyBuffer: this.buyGutter,
            sellBuffer: this.sellGutter,
            checkBuffer: 0,
            smaLong: 0,
            smaMedium: 0,
            smaShort: 0,
            profit: this.totalPofit,
            numberOfTrades: this.orderLocations.length
          })
        }

      }
    }
    this.topAlgos = this.listOfProfits.sort((a, b) => b.profit - a.profit).slice(0, 5)
    this.buyGutter = this.topAlgos[0].buyBuffer
    this.sellGutter = this.topAlgos[0].sellBuffer
    this.check200Gutter = this.topAlgos[0].checkBuffer
    this.runSimulation()
  }
  calculateBuyAndSellPoints() {
    let buyOrSell = 'Buy'
    for (let i = 0; i < this.selectedStockLast5.length; i++) {
      if (buyOrSell == 'Buy') {
        if ((((this.selectedStockLast5[i].avg - this.selectedStockLast40[i].avg) / this.selectedStockLast40[i].avg) < (this.buyGutter * -1)) && ((Math.abs(this.selectedStockLast5[i].avg - this.selectedStockLast200[i].avg) / this.selectedStockLast200[i].avg) < this.check200Gutter)) {
          this.executeOrder(this.selectedStockLast5[i], 'Buy')
          buyOrSell = 'Sell'
        }
      }
      else {
        if ((((this.selectedStockLast5[i].avg - this.selectedStockLast40[i].avg) / this.selectedStockLast40[i].avg) > this.sellGutter) && this.selectedStockLast5[i].close > this.orderLocations[this.orderLocations.length - 1].price) {
          this.executeOrder(this.selectedStockLast5[i], 'Sell')
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
        xMin: 0,
        xMax: 0,
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
    for (let i = 0; i < this.distinctStocks.length; i++) {
      let filteredStock = this.allHistory.filter(e => e.stockName == this.distinctStocks[i])
      let tempStock200: sma200Array[] = []
      for (let j = 200; j < filteredStock.length; j++) {
        let last200Price: number = 0;
        for (let k = 0; k < 200; k++) {
          last200Price += filteredStock[j - k].close
        }
        let last200Avg = last200Price / 200
        tempStock200.push({ stockName: this.distinctStocks[i], close: filteredStock[j].close, avg: last200Avg })
      }
      let tempStock40: sma200Array[] = []
      for (let j = 200; j < filteredStock.length; j++) {
        let last50Price: number = 0;
        for (let k = 0; k < 40; k++) {
          last50Price += filteredStock[j - k].close
        }
        let last200Avg = last50Price / 40
        tempStock40.push({ stockName: this.distinctStocks[i], close: filteredStock[j].close, avg: last200Avg })
      }
      let tempStock5: sma200Array[] = []
      for (let j = 200; j < filteredStock.length; j++) {
        let last50Price: number = 0;
        for (let k = 0; k < 5; k++) {
          last50Price += filteredStock[j - k].close
        }
        let last200Avg = last50Price / 5
        tempStock5.push({ stockName: this.distinctStocks[i], close: filteredStock[j].close, avg: last200Avg })
      }
      this.listOfLast200Days.push(...tempStock200)
      this.listOfLast40Days.push(...tempStock40)
      this.listOfLast5Days.push(...tempStock5)
    }
  }
  updateChart() {
    this.stockChart.data.datasets[0].data = this.selectedStockLast200.map(e => e.close)
    this.stockChart.data.datasets[0].label = 'Actual'
    this.stockChart.data.datasets[1].data = this.selectedStockLast200.map(e => e.avg)
    this.stockChart.data.datasets[1].label = '200'
    this.stockChart.data.datasets[2].data = this.selectedStockLast40.map(e => e.avg)
    this.stockChart.data.datasets[2].label = '40'
    this.stockChart.data.datasets[3].data = this.selectedStockLast5.map(e => e.avg)
    this.stockChart.data.datasets[3].label = '5'
    this.stockChart.data.labels = this.selectedStockLast200.map(e => 'e.date')
    this.stockChart.options.scales.y.max = this.getMaxForChart(this.selectedStockLast200)
    this.stockChart.options.scales.y.min = this.getMinForChart(this.selectedStockLast200)
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
    this.calculateSma()
    this.getStockDisplay()
    this.createOrUpdateChart()
    this.runSimulation()
    await this.getStockHistoricalData()
    this.isLoading = false;

  }
}
