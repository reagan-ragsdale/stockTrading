import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DbAlgorithmList, dbAlgorithmListRepo } from '../../shared/tasks/dbAlgorithmList';
import { DbStockBasicHistory, dbStockBasicHistoryRepo } from '../../shared/tasks/dbStockBasicHistory';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DbStockHistoryData, dbStockHistoryDataRepo } from '../../shared/tasks/dbStockHistoryData';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AddLineComponent } from "./add-line/add-line.component";
import { BuyRule, LineData, lineType, RuleDto, SellRule } from '../Dtos/ServerAlgoDto';
import { AddRuleComponent } from './addrule/addrule.component';
import { dbOrdersRepo } from '../../shared/tasks/dbOrders';
import zoomPlugin from 'chartjs-plugin-zoom';
import { AlgoLoopComponent } from "./algo-loop/algo-loop.component";


type OperatorFunction = (rule: BuyRule | SellRule, index: number, buyPrice?: number) => boolean;
type serverAlgos = {
  name: string;
  isSelected: boolean;
}
type sma200Array = {
  stockName: string;
  close: number;
  avg: number;
  date: number;
  dateString: string;
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
  date: number;
  price: number;
  dateString: string
}

@Component({
  selector: 'app-server-trade-screen',
  imports: [MatCheckboxModule, CommonModule, MatTableModule, MatIconModule, MatProgressSpinnerModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatInputModule, FormsModule, MatSlideToggleModule, AddLineComponent, AddRuleComponent, AlgoLoopComponent],
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
  intraDayShortSellSma: number = 0
  intraDayShortBuySma: number = 0

  interDayLongSma: number = 0;
  interDayMediumSma: number = 0
  interDayShortSma: number = 0
  stopLoss: number = 0
  readonly dialog = inject(MatDialog);
  @ViewChild('addLineTemplate', { static: true }) addLineTemplate!: TemplateRef<any>;
  @ViewChild('addRuleTemplate', { static: true }) addRuleTemplate!: TemplateRef<any>;
  @ViewChild('algoLoopTemplate', { static: true }) algoLoopTemplate!: TemplateRef<any>;


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
        //this.intraDayLongSma = 3600;
        //this.intraDayMediumSma = 1800;
        //this.intraDayShortSma = 300
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
        //this.calculateIntraDaySma()
        this.updateChartIntraDay()
        this.updateVolumeChartIntraDay()
        this.addNewLinesToGraph(this.listOfAddedLines)
        this.refreshRules()
        this.onRunSimulation()
        //this.runSimulationIntraDay()
        this.isLoading = false
      }


    }
  }


  resetZoom() {
    this.stockChart.resetZoom()
  }

  createOrUpdateChart() {

    console.log('create chart')
    this.stockChart = new Chart("stock-chart", {
      type: 'line', //this denotes tha type of chart

      data: {// values on X-Axis

        labels: this.selectedInterDayStockData.map(e => new Date(e.date).toLocaleDateString()),

        datasets: [
          {
            label: 'Price',
            data: this.selectedInterDayStockData.map(e => e.close),
            backgroundColor: '#54C964',
            hoverBackgroundColor: '#54C964',
            borderColor: '#54C964',
            pointBackgroundColor: '#54C964',
            pointBorderColor: '#54C964',
            pointRadius: 0,
            spanGaps: true
          }/* ,
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
          } */
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
            max: this.getMaxForChart(this.selectedInterDayStockData.map(e => e.close)),
            min: this.getMinForChart(this.selectedInterDayStockData.map(e => e.close)),
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
            annotations: this.annotationsArray

          }
        }
      }
    })


  }

  getMaxForChart(prices: number[]): number {
    let max = -1000000000
    for (let i = 0; i < prices.length; i++) {
      if (prices[i] > max) {
        max = prices[i]
      }
    }
    return max + 2

  }
  getMinForChart(prices: number[]): number {
    let min = 1000000000
    for (let i = 0; i < prices.length; i++) {
      if (prices[i] < min) {
        min = prices[i]
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
            label: 'Price',
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
            max: Math.max(...this.rsiData.map(e => e.rsiNum)),
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
      //this.calculateIntraDaySma()
      this.updateChartIntraDay()
      this.updateVolumeChartIntraDay()
      //this.runSimulationIntraDay()
      //this.calcualateIntraDayRsi()
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
  resultsInfo: any[] = []
  resultsColums: string[] = ["Profit", "NoTrades", "Profit Factor", "Wins", "Losses", "AvgWinAmt", "AvgLossAmt", "Expectancy"]
  onRunSimulation() {
    if (this.intraDayChecked) {
      this.isLoading = true
      if (this.listOfAddedRules.BuyRules.length > 0 && this.listOfAddedRules.SellRules.length > 0) {
        let result = this.addRule()
        this.updateGraphBuyAndSellPointsIntraDayNew(result.orderLocations)
        this.totalProfit = result.profit

        this.resultsInfo = []
        let grossProfit = 0
        let grossLoss = 0
        let wins = 0
        let losses = 0
        let winRate = 0
        let lossRate = 0
        let avgWinAmt = 0
        let avgLossAmt = 0
        for (let i = 0; i < result.orderLocations.length; i++) {
          if (result.orderLocations[i].buySell == 'Sell') {
            let proft = result.orderLocations[i].price - result.orderLocations[i - 1].price
            if (proft < 0) {
              grossLoss += proft
              losses++
            }
            else {
              wins++
              grossProfit += proft
            }
          }
        }
        winRate = wins == 0 ? 0 : wins / (result.orderLocations.length / 2)
        lossRate = losses == 0 ? 0 : losses / (result.orderLocations.length / 2)
        avgWinAmt = wins == 0 ? 0 : grossProfit / wins
        avgLossAmt = losses == 0 ? 0 : grossLoss / losses
        console.log([winRate, avgWinAmt, lossRate, avgLossAmt])
        this.resultsInfo.push({
          profit: result.profit,
          numberOfTrades: result.orderLocations.length / 2,
          profitFactor: grossLoss == 0 ? grossProfit : grossProfit / Math.abs(grossLoss),
          wins: wins,
          losses: losses,
          avgWinAmt: avgWinAmt,
          avgLossAmt: avgLossAmt,
          expectancy: (avgWinAmt * winRate) - (avgLossAmt * lossRate)
        })
      }

      //this.runSimulationIntraDayNew()
      this.isLoading = false
    }
    else {
      //this.isLoading = true
      //this.runSimulation()
      //this.isLoading = false
    }
  }
  async onRunSimulationNew() {
    if (this.intraDayChecked) {
      this.isLoading = true
      let resultList = []
      //this.distinctDates.length
      for (let i = 0; i < this.distinctDates.length; i++) {
        await this.updateStockChartData(this.distinctDates[i])
        this.addNewLinesToGraphNew()
        let result = this.addRule()
        let winTrades = 0
        let loseTrades = 0
        for (let i = 0; i < result.orderLocations.length; i++) {
          if (result.orderLocations[i].buySell == 'Sell') {
            let profit = result.orderLocations[i].price - result.orderLocations[i - 1].price
            if (profit > 0) {
              winTrades++
            }
            else {
              loseTrades++
            }
          }
        }
        resultList.push({ profit: result.profit, numberOfTrades: result.orderLocations.length, orders: result.orderLocations, wins: winTrades, losses: loseTrades })
      }
      let finalsResultData: any = {}
      finalsResultData.avgProfit = resultList.reduce((sum, val) => sum + val.profit, 0) / resultList.length
      finalsResultData.avgNumTrades = resultList.reduce((sum, val) => sum + val.numberOfTrades, 0) / resultList.length
      finalsResultData.totalProfit = resultList.reduce((sum, val) => sum + val.profit, 0)
      finalsResultData.totalWins = resultList.reduce((sum, val) => sum + val.wins, 0)
      finalsResultData.totalLosses = resultList.reduce((sum, val) => sum + val.losses, 0)

      console.log('All Day Results below')
      console.log(finalsResultData)
      console.log('result list below')
      console.log(resultList)
      //let result = this.addRule()
      //this.updateGraphBuyAndSellPointsIntraDayNew(result.orderLocations)
      //this.totalProfit = result.profit
      //this.runSimulationIntraDayNew()
      this.isLoading = false
    }
    else {
      this.isLoading = true
      this.runSimulation()
      this.isLoading = false
    }
  }
  onRunSimulationNewLoop() {

  }
  async onRunEntireSimulationIntraDayAllDays() {
    this.isLoading = true;
    await this.runEntireSimulationIntraDayAllDaysSpecific()
    this.isLoading = false
  }
  /* Intra Day */
  async onSelectedDateChange(event: any) {
    if (event.isUserInput == true) {
      this.isLoading = true
      this.selectedDate = event.source.value
      await this.updateStockChartData(this.selectedDate)
      //this.calculateIntraDaySma()
      this.updateChartIntraDay()
      this.updateVolumeChartIntraDay()
      this.addNewLinesToGraph(this.listOfAddedLines)
      this.refreshRules()
      this.onRunSimulation()

      //this.runSimulationIntraDay()
      //this.topAlgos = []
      this.isLoading = false
    }
  }
  async getStockHistoricalData() {
    this.distinctDates = (await dbStockHistoryDataRepo.groupBy({ where: { stockName: this.selectedStockName }, group: ['date'], orderBy: { date: 'desc' } })).map(e => e.date)
    this.selectedDate = this.distinctDates[0]
  }
  async updateStockChartData(selectedDate: string) {
    this.stockDataForSelectedDay = await dbStockHistoryDataRepo.find({ where: { stockName: this.selectedStockName, date: selectedDate }, orderBy: { time: 'asc' } })
    //this.stockDataForSelectedDay = this.stockDataForSelectedDay.filter(e => reusedFunctions.isWithinTradingHoursLocal(e.time))
  }
  async updateStockChartDataNew(selectedDate: string): Promise<DbStockHistoryData[]> {
    let returnData = await dbStockHistoryDataRepo.find({ where: { stockName: this.selectedStockName, date: selectedDate }, orderBy: { time: 'asc' } })
    // returnData = returnData.filter(e => reusedFunctions.isWithinTradingHoursLocal(e.time))
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
    this.listOfLastHour.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma - 1].stockPrice, avg: windowSum / this.intraDayLongSma, date: this.stockDataForSelectedDay[this.intraDayLongSma - 1].time, dateString: new Date(this.stockDataForSelectedDay[this.intraDayLongSma - 1].time).toLocaleTimeString() })
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      windowSum += this.stockDataForSelectedDay[j].stockPrice - this.stockDataForSelectedDay[j - this.intraDayLongSma].stockPrice
      this.listOfLastHour.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: windowSum / this.intraDayLongSma, date: this.stockDataForSelectedDay[j].time, dateString: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }

    windowSum = 0

    for (let i = this.intraDayLongSma - this.intraDayMediumSma; i < this.intraDayLongSma; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    this.listOfLast30Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma - 1].stockPrice, avg: windowSum / this.intraDayMediumSma, date: this.stockDataForSelectedDay[this.intraDayLongSma - 1].time, dateString: new Date(this.stockDataForSelectedDay[this.intraDayLongSma - 1].time).toLocaleTimeString() })
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      windowSum += this.stockDataForSelectedDay[j].stockPrice - this.stockDataForSelectedDay[j - this.intraDayMediumSma].stockPrice
      this.listOfLast30Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: windowSum / this.intraDayMediumSma, date: this.stockDataForSelectedDay[j].time, dateString: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }

    windowSum = 0

    for (let i = this.intraDayLongSma - this.intraDayShortSma; i < this.intraDayLongSma; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    this.listOfLast5Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma - 1].stockPrice, avg: windowSum / this.intraDayShortSma, date: this.stockDataForSelectedDay[this.intraDayLongSma - 1].time, dateString: new Date(this.stockDataForSelectedDay[this.intraDayLongSma - 1].time).toLocaleTimeString() })
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      windowSum += this.stockDataForSelectedDay[j].stockPrice - this.stockDataForSelectedDay[j - this.intraDayShortSma].stockPrice
      this.listOfLast5Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: windowSum / this.intraDayShortSma, date: this.stockDataForSelectedDay[j].time, dateString: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }

    windowSum = 0

    for (let i = this.intraDayLongSma - this.intraDayShortSellSma; i < this.intraDayLongSma; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    this.listOfLast2Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma - 1].stockPrice, avg: windowSum / this.intraDayShortSellSma, date: this.stockDataForSelectedDay[this.intraDayLongSma - 1].time, dateString: new Date(this.stockDataForSelectedDay[this.intraDayLongSma - 1].time).toLocaleTimeString() })
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      windowSum += this.stockDataForSelectedDay[j].stockPrice - this.stockDataForSelectedDay[j - this.intraDayShortSellSma].stockPrice
      this.listOfLast2Minutes.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: windowSum / this.intraDayShortSellSma, date: this.stockDataForSelectedDay[j].time, dateString: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }

    windowSum = 0

    for (let i = this.intraDayLongSma - this.intraDayShortBuySma; i < this.intraDayLongSma; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    this.listOfLastMinute.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[this.intraDayLongSma - 1].stockPrice, avg: windowSum / this.intraDayShortBuySma, date: this.stockDataForSelectedDay[this.intraDayLongSma - 1].time, dateString: new Date(this.stockDataForSelectedDay[this.intraDayLongSma - 1].time).toLocaleTimeString() })
    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      windowSum += this.stockDataForSelectedDay[j].stockPrice - this.stockDataForSelectedDay[j - this.intraDayShortBuySma].stockPrice
      this.listOfLastMinute.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[j].stockPrice, avg: windowSum / this.intraDayShortBuySma, date: this.stockDataForSelectedDay[j].time, dateString: new Date(this.stockDataForSelectedDay[j].time).toLocaleTimeString() })
    }
  }


  calculateIntraDayLongSma(longValue: number): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = 0; i < longValue; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[longValue - 1].stockPrice, avg: (windowSum / longValue), date: this.stockDataForSelectedDay[longValue - 1].time, dateString: new Date(this.stockDataForSelectedDay[longValue - 1].time).toLocaleTimeString() });

    for (let i = longValue; i < this.stockDataForSelectedDay.length; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - longValue].stockPrice;
      returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: (windowSum / longValue), date: this.stockDataForSelectedDay[i].time, dateString: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() });
    }
    return returnArray

  }
  calculateIntraDayShortSmaAllDays(longValue: number, shortValue: number, selectedStockData: DbStockHistoryData[]) {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = longValue - shortValue; i < longValue; i++) {
      windowSum += selectedStockData[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[longValue - 1].stockPrice, avg: (windowSum / shortValue), date: selectedStockData[longValue - 1].time, dateString: new Date(selectedStockData[longValue - 1].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < selectedStockData.length; i++) {
      windowSum += selectedStockData[i].stockPrice - selectedStockData[i - shortValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[i].stockPrice, avg: (windowSum / shortValue), date: selectedStockData[i].time, dateString: new Date(selectedStockData[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  calculateIntraDayMediumSmaAllDays(longValue: number, mediumValue: number, selectedStockData: DbStockHistoryData[]) {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = longValue - mediumValue; i < longValue; i++) {
      windowSum += selectedStockData[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[longValue].stockPrice, avg: (windowSum / mediumValue), date: selectedStockData[longValue].time, dateString: new Date(selectedStockData[longValue].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < selectedStockData.length; i++) {
      windowSum += selectedStockData[i].stockPrice - selectedStockData[i - mediumValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[i].stockPrice, avg: (windowSum / mediumValue), date: selectedStockData[i].time, dateString: new Date(selectedStockData[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  calculateIntraDayLongSmaAllDays(longValue: number, selectedStockData: DbStockHistoryData[]): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = 0; i < longValue; i++) {
      windowSum += selectedStockData[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[longValue].stockPrice, avg: (windowSum / longValue), date: selectedStockData[longValue].time, dateString: new Date(selectedStockData[longValue].time).toLocaleTimeString() });

    for (let i = longValue; i < selectedStockData.length; i++) {
      windowSum += selectedStockData[i].stockPrice - selectedStockData[i - longValue].stockPrice;
      returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[i].stockPrice, avg: (windowSum / longValue), date: selectedStockData[i].time, dateString: new Date(selectedStockData[i].time).toLocaleTimeString() });
    }
    return returnArray
  }
  calculateIntraDayMediumSmaNew(longValue: number, mediumValue: number): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0
    for (let i = longValue - mediumValue; i < longValue; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[longValue - 1].stockPrice, avg: (windowSum / mediumValue), date: this.stockDataForSelectedDay[longValue - 1].time, dateString: new Date(this.stockDataForSelectedDay[longValue - 1].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < this.stockDataForSelectedDay.length; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - mediumValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: (windowSum / mediumValue), date: this.stockDataForSelectedDay[i].time, dateString: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  calculateIntraDayShortSmaNew(longValue: number, shortValue: number): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0
    for (let i = longValue - shortValue; i < longValue; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[longValue - 1].stockPrice, avg: (windowSum / shortValue), date: this.stockDataForSelectedDay[longValue - 1].time, dateString: new Date(this.stockDataForSelectedDay[longValue - 1].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < this.stockDataForSelectedDay.length; i++) {
      windowSum += this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - shortValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: this.stockDataForSelectedDay[i].stockPrice, avg: (windowSum / shortValue), date: this.stockDataForSelectedDay[i].time, dateString: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  updateChartIntraDay() {
    this.stockChart.data.datasets[0].data = this.stockDataForSelectedDay.map(e => e.stockPrice)
    this.stockChart.data.datasets[0].label = 'Price'
    this.stockChart.data.labels = this.stockDataForSelectedDay.map(e => new Date(e.time).toLocaleTimeString())
    this.stockChart.options.scales.y.max = this.getMaxForChart(this.stockDataForSelectedDay.map(e => e.stockPrice))
    this.stockChart.options.scales.y.min = this.getMinForChart(this.stockDataForSelectedDay.map(e => e.stockPrice))
    this.stockChart.update()
  }
  updateVolumeChartIntraDay() {
    let volumeData: (number | null)[] = []
    volumeData.push(null)
    for (let i = 1; i < this.stockDataForSelectedDay.length; i++) {
      volumeData.push(this.stockDataForSelectedDay[i].volume - this.stockDataForSelectedDay[i - 1].volume)
    }
    this.rsiChart.data.datasets[0].data = [...volumeData]
    this.rsiChart.data.datasets[0].label = 'Volume'
    this.rsiChart.data.labels = this.stockDataForSelectedDay.map(e => new Date(e.time).toLocaleTimeString())
    this.rsiChart.options.scales.y.max = this.getMaxForChart(volumeData.slice(1) as number[])
    this.rsiChart.options.scales.y.min = this.getMinForChart(volumeData.slice(1) as number[])
    this.rsiChart.update()
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
  runSimulationIntraDayNew() {
    this.intraDayShortSellSma = 120
    this.intraDayShortBuySma = 60
    this.calculateIntraDaySma()
    this.updateChartIntraDay()
    let result = this.calculateBuyAndSellPointsIntraDaySellAtEndNew(this.listOfLastHour, this.listOfLast30Minutes, this.listOfLast5Minutes, this.listOfLast2Minutes, this.listOfLastMinute, this.buyGutter, this.sellGutter, this.check200Gutter)
    this.updateGraphBuyAndSellPointsIntraDayNew(result.orderLocations)
    console.log(result)
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

  async runEntireSimulationIntraDayAllDaysSpecific() {
    this.intraDayShortSellSma = 120
    console.log(this.distinctDates)

    let topAverages: any[] = []
    //for (let i = 1; i <= 60; i += 5) {
    //this.intraDayShortBuySma = i
    let listOfProfits = []
    for (let h = 0; h < this.distinctDates.length; h++) {
      let selectedDate = this.distinctDates[h]
      this.stockDataForSelectedDay = await this.updateStockChartDataNew(selectedDate)
      this.calculateIntraDaySma()
      let result = this.calculateBuyAndSellPointsIntraDaySellAtEnd(this.listOfLastHour, this.listOfLast30Minutes, this.listOfLast5Minutes, this.listOfLast2Minutes, .003, .002, .001)
      listOfProfits.push({
        buyBuffer: .003,
        sellBuffer: .002,
        checkBuffer: .001,
        smaLong: 3600,
        smaMedium: 1800,
        smaShort: 300,
        smaShortSell: 120,
        profit: result.profit,
        numberOfTrades: result.orderLocations.length
      })
    }
    let avgProfit = listOfProfits.map(e => e.profit).reduce((sum, val) => sum + val, 0) / listOfProfits.length
    let avgNumTrades = listOfProfits.map(e => e.numberOfTrades).reduce((sum, val) => sum + val, 0) / listOfProfits.length
    topAverages.push({
      buyBuffer: .003,
      sellBuffer: .002,
      checkBuffer: .001,
      smaLong: 3600,
      smaMedium: 1800,
      smaShort: 300,
      smaShortSell: 120,
      profit: avgProfit,
      numberOfTrades: avgNumTrades
    })



    // }
    console.log(topAverages)
    /*  this.topAlgos = topAverages
     this.buyGutter = this.topAlgos[0].buyBuffer
     this.sellGutter = this.topAlgos[0].sellBuffer
     this.check200Gutter = this.topAlgos[0].checkBuffer
     this.intraDayLongSma = this.topAlgos[0].smaLong
     this.intraDayMediumSma = this.topAlgos[0].smaMedium
     this.intraDayShortSma = this.topAlgos[0].smaShort
     this.runSimulationIntraDay() */
  }




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
      if (canTrade == false) {
        if ((shortArray[i].date - orderLocations[orderLocations.length - 1].date) > 1800000) {
          canTrade = true
        }
      }
      if (canTrade && buyOrSell == 'Buy') {
        if (canTrade && buyOrSell == 'Buy' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) < (buyGutter * -1)) && (((shortArray[i].avg - longArray[i].avg) / longArray[i].avg) < checkGutter) && (shortArrayBuy[i].avg > shortArray[i].avg)) {
          orderLocations.push({ buySell: 'Buy', date: shortArray[i].date, price: shortArray[i].close, dateString: new Date(shortArray[i].date).toLocaleTimeString() })
          stopLoss = shortArray[i].close - (shortArray[i].close * buyGutter)
          stopLossThreshold = shortArray[i].close + (shortArray[i].close * .001)
          tradeHigh = shortArray[i].close
          buyOrSell = 'Sell'
        }
      }
      else if (canTrade && buyOrSell == 'Sell') {
        if ((((shortArraySell[i].avg - mediumArray[i].avg) / mediumArray[i].avg) > sellGutter) && shortArraySell[i].close > orderLocations[orderLocations.length - 1].price) {
          orderLocations.push({ buySell: 'Sell', date: shortArraySell[i].date, price: shortArraySell[i].close, dateString: new Date(shortArraySell[i].date).toLocaleTimeString() })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
          buyOrSell = 'Buy'
        }
        else if (shortArraySell[i].close <= stopLoss) {
          orderLocations.push({ buySell: 'Sell', date: shortArraySell[i].date, price: shortArraySell[i].close, dateString: new Date(shortArraySell[i].date).toLocaleTimeString() })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
          canTrade = false;
          buyOrSell = 'Buy'
        }
        else if (i == longArrayLen - 1) {
          orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close, dateString: new Date(shortArray[i].date).toLocaleTimeString() })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
        }
        else if ((shortArray[i].close >= stopLossThreshold) && stopLoss < orderLocations[orderLocations.length - 1].price) {
          stopLoss = orderLocations[orderLocations.length - 1].price
        }
        else if ((shortArray[i].close >= stopLossThreshold) && stopLoss >= orderLocations[orderLocations.length - 1].price) {
          stopLoss += shortArray[i].close - tradeHigh
        }
        if (shortArray[i].close > tradeHigh) {
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
    for (let i = 0; i < longArrayLen; i++) {
      if (canTrade == false) {
        if ((shortArray[i].date - orderLocations[orderLocations.length - 1].date) > 1800000) {
          canTrade = true
        }
      }
      if (canTrade && buyOrSell == 'Buy') {
        if ((((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) < (buyGutter * -1)) && (((shortArray[i].avg - longArray[i].avg) / longArray[i].avg) < checkGutter)) {
          orderLocations.push({ buySell: 'Buy', date: shortArray[i].date, price: shortArray[i].close, dateString: new Date(shortArray[i].date).toLocaleTimeString() })
          stopLoss = shortArray[i].close - (shortArray[i].close * .002)
          stopLossThreshold = shortArray[i].close + (shortArray[i].close * .001)
          tradeHigh = shortArray[i].close
          buyOrSell = 'Sell'
        }
      }
      else if (canTrade && buyOrSell == 'Sell') {
        if ((((shortArraySell[i].avg - mediumArray[i].avg) / mediumArray[i].avg) > sellGutter) && shortArray[i].close > orderLocations[orderLocations.length - 1].price) {
          orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close, dateString: new Date(shortArray[i].date).toLocaleTimeString() })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
          buyOrSell = 'Buy'
        }
        else if (shortArray[i].close <= stopLoss) {
          orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close, dateString: new Date(shortArray[i].date).toLocaleTimeString() })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
          buyOrSell = 'Buy'
          canTrade = false
        }
        else if (i == longArrayLen - 1) {
          orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close, dateString: new Date(shortArray[i].date).toLocaleTimeString() })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
        }
        else if ((shortArray[i].close >= stopLossThreshold) && stopLoss < orderLocations[orderLocations.length - 1].price) {
          stopLoss = orderLocations[orderLocations.length - 1].price
        }
        else if ((shortArray[i].close >= stopLossThreshold) && stopLoss >= orderLocations[orderLocations.length - 1].price) {
          stopLoss += shortArray[i].close - tradeHigh
        }
        if (shortArray[i].close > tradeHigh) {
          tradeHigh = shortArray[i].close
        }
      }
    }
    return { orderLocations: orderLocations, profit: profit }
  }
  clearGraphBuyAndSellPoints() {
    this.stockChart.options.plugins.annotation.annotations = []
    this.stockChart.update()
  }
  updateGraphBuyAndSellPointsIntraDayNew(orderLocations: orderLocation[]) {
    console.log(orderLocations)
    this.annotationsArray = []
    for (let i = 0; i < orderLocations.length; i++) {
      this.annotationsArray.push({
        type: 'line',
        //display: this.selectedStockHistoryData.length > 0,

        xMin: this.stockDataForSelectedDay.findIndex(x => x.time == orderLocations[i].date),
        xMax: this.stockDataForSelectedDay.findIndex(x => x.time == orderLocations[i].date),
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
        orderLocations.push({ buySell: 'Buy', date: shortArray[i].date, price: shortArray[i].close, dateString: new Date(shortArray[i].date).toLocaleDateString() })
        buyOrSell = 'Sell'
      }
      else if (buyOrSell == 'Sell' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) > sellGutter) && shortArray[i].close > orderLocations[orderLocations.length - 1].price) {
        orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close, dateString: new Date(shortArray[i].date).toLocaleDateString() })
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
    returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[longValue - 1].close, avg: (windowSum / shortValue), date: this.selectedInterDayStockData[longValue - 1].date, dateString: new Date(this.selectedInterDayStockData[longValue - 1].date).toLocaleDateString() }); // Push the average of the first window

    for (let i = longValue; i < this.selectedInterDayStockData.length; i++) {
      windowSum += this.selectedInterDayStockData[i].close - this.selectedInterDayStockData[i - shortValue].close; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[i].close, avg: (windowSum / shortValue), date: this.selectedInterDayStockData[i].date, dateString: new Date(this.selectedInterDayStockData[i].date).toLocaleDateString() }); // Push the new average
    }
    return returnArray
  }
  calculateInterDayMediumSma(longValue: number, mediumValue: number) {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = longValue - mediumValue; i < longValue; i++) {
      windowSum += this.selectedInterDayStockData[i].close;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[longValue - 1].close, avg: (windowSum / mediumValue), date: this.selectedInterDayStockData[longValue - 1].date, dateString: new Date(this.selectedInterDayStockData[longValue - 1].date).toLocaleDateString() }); // Push the average of the first window

    for (let i = longValue; i < this.selectedInterDayStockData.length; i++) {
      windowSum += this.selectedInterDayStockData[i].close - this.selectedInterDayStockData[i - mediumValue].close; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[i].close, avg: (windowSum / mediumValue), date: this.selectedInterDayStockData[i].date, dateString: new Date(this.selectedInterDayStockData[i].date).toLocaleDateString() }); // Push the new average
    }
    return returnArray
  }
  calculateInterDayLongSma(longValue: number): sma200Array[] {
    let returnArray: sma200Array[] = []
    let windowSum: number = 0;
    for (let i = 0; i < longValue; i++) {
      windowSum += this.selectedInterDayStockData[i].close;
    }
    returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[longValue - 1].close, avg: (windowSum / longValue), date: this.selectedInterDayStockData[longValue - 1].date, dateString: new Date(this.selectedInterDayStockData[longValue - 1].date).toLocaleDateString() });

    for (let i = longValue; i < this.selectedInterDayStockData.length; i++) {
      windowSum += this.selectedInterDayStockData[i].close - this.selectedInterDayStockData[i - longValue].close;
      returnArray.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[i].close, avg: (windowSum / longValue), date: this.selectedInterDayStockData[i].date, dateString: new Date(this.selectedInterDayStockData[i].date).toLocaleDateString() });
    }
    return returnArray
  }

  calculateBuyAndSellPointsInterDay() {
    let buyOrSell = 'Buy'
    let orderLocations: orderLocation[] = []
    let totalProfit = 0
    for (let i = 0; i < this.shortSmaResults.length; i++) {
      if (buyOrSell == 'Buy' && ((((this.shortSmaResults[i].avg - this.mediumSmaResults[i].avg) / this.mediumSmaResults[i].avg) < (this.buyGutter * -1)) && (((this.shortSmaResults[i].avg - this.longSmaResults[i].avg) / this.longSmaResults[i].avg) < this.check200Gutter))) {
        orderLocations.push({ buySell: 'Buy', date: this.shortSmaResults[i].date, price: this.shortSmaResults[i].close, dateString: new Date(this.shortSmaResults[i].date).toLocaleDateString() })
        buyOrSell = 'Sell'
      }
      else if (buyOrSell == 'Sell' && ((((this.shortSmaResults[i].avg - this.mediumSmaResults[i].avg) / this.mediumSmaResults[i].avg) > this.sellGutter) && this.shortSmaResults[i].close > orderLocations[orderLocations.length - 1].price)) {
        orderLocations.push({ buySell: 'Sell', date: this.shortSmaResults[i].date, price: this.shortSmaResults[i].close, dateString: new Date(this.shortSmaResults[i].date).toLocaleDateString() })
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
    this.longSmaResults.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[this.interDayLongSma - 1].close, avg: windowSum / this.interDayLongSma, date: this.selectedInterDayStockData[this.interDayLongSma - 1].date, dateString: new Date(this.selectedInterDayStockData[this.interDayLongSma - 1].date).toLocaleDateString() })

    for (let j = this.interDayLongSma; j < this.selectedInterDayStockData.length; j++) {
      windowSum += this.selectedInterDayStockData[j].close - this.selectedInterDayStockData[j - this.interDayLongSma].close;
      this.longSmaResults.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[j].close, avg: windowSum / this.interDayLongSma, date: this.selectedInterDayStockData[j].date, dateString: new Date(this.selectedInterDayStockData[j].date).toLocaleDateString() })
    }

    windowSum = 0
    //calculate the medium sma values
    for (let i = this.interDayLongSma - this.interDayMediumSma; i < this.interDayLongSma; i++) {
      windowSum += this.selectedInterDayStockData[i].close
    }
    this.mediumSmaResults.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[this.interDayLongSma - 1].close, avg: windowSum / this.interDayMediumSma, date: this.selectedInterDayStockData[this.interDayLongSma - 1].date, dateString: new Date(this.selectedInterDayStockData[this.interDayLongSma - 1].date).toLocaleDateString() })

    for (let j = this.interDayLongSma; j < this.selectedInterDayStockData.length; j++) {
      windowSum += this.selectedInterDayStockData[j].close - this.selectedInterDayStockData[j - this.interDayMediumSma].close;
      this.mediumSmaResults.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[j].close, avg: windowSum / this.interDayMediumSma, date: this.selectedInterDayStockData[j].date, dateString: new Date(this.selectedInterDayStockData[j].date).toLocaleDateString() })
    }

    windowSum = 0
    //calculate the short sma values
    for (let i = this.interDayLongSma - this.interDayShortSma; i < this.interDayLongSma; i++) {
      windowSum += this.selectedInterDayStockData[i].close
    }
    this.shortSmaResults.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[this.interDayLongSma - 1].close, avg: windowSum / this.interDayShortSma, date: this.selectedInterDayStockData[this.interDayLongSma - 1].date, dateString: new Date(this.selectedInterDayStockData[this.interDayLongSma - 1].date).toLocaleDateString() })

    for (let j = this.interDayLongSma; j < this.selectedInterDayStockData.length; j++) {
      windowSum += this.selectedInterDayStockData[j].close - this.selectedInterDayStockData[j - this.interDayShortSma].close;
      this.shortSmaResults.push({ stockName: this.selectedStockName, close: this.selectedInterDayStockData[j].close, avg: windowSum / this.interDayShortSma, date: this.selectedInterDayStockData[j].date, dateString: new Date(this.selectedInterDayStockData[j].date).toLocaleDateString() })
    }
  }
  updateChart() {
    this.stockChart.data.datasets[0].data = this.selectedInterDayStockData.map(e => e.close)
    this.stockChart.data.datasets[0].label = 'Price'
    /* this.stockChart.data.datasets[1].data = this.longSmaResults.map(e => e.avg)
    this.stockChart.data.datasets[1].label = this.interDayLongSma
    this.stockChart.data.datasets[2].data = this.mediumSmaResults.map(e => e.avg)
    this.stockChart.data.datasets[2].label = this.interDayMediumSma
    this.stockChart.data.datasets[3].data = this.shortSmaResults.map(e => e.avg)
    this.stockChart.data.datasets[3].label = this.interDayShortSma */
    this.stockChart.data.labels = this.selectedInterDayStockData.map(e => new Date(e.date).toLocaleDateString())
    this.stockChart.options.scales.y.max = this.getMaxForChart(this.selectedInterDayStockData.map(e => e.close))
    this.stockChart.options.scales.y.min = this.getMinForChart(this.selectedInterDayStockData.map(e => e.close))
    this.stockChart.update()
  }
  calcualateIntraDayRsi() {
    this.rsiData.length = 0

    /* let tradeHigh = 0
    let tradeLow = 1000000
    for (let i = 0; i < this.intraDayLongSma; i++) {
      if (this.stockDataForSelectedDay[i].stockPrice > tradeHigh) {
        tradeHigh = this.stockDataForSelectedDay[i].stockPrice
      }
      if (this.stockDataForSelectedDay[i].stockPrice < tradeLow) {
        tradeLow = this.stockDataForSelectedDay[i].stockPrice
      }
      this.rsiData.push({ value: null, time: this.stockDataForSelectedDay[i].time })
    }

    for (let j = this.intraDayLongSma; j < this.stockDataForSelectedDay.length; j++) {
      if (this.stockDataForSelectedDay[j].stockPrice > tradeHigh) {
        tradeHigh = this.stockDataForSelectedDay[j].stockPrice
      }
      if (this.stockDataForSelectedDay[j].stockPrice < tradeLow) {
        tradeLow = this.stockDataForSelectedDay[j].stockPrice
      }
      let newValue = (this.stockDataForSelectedDay[j].stockPrice - tradeLow) / (tradeHigh - tradeLow)
      this.rsiData.push({ value: newValue * 100, time: this.stockDataForSelectedDay[j].time })
    } */

    /* this.rsiChart.data.datasets[0].data = [...this.rsiData.map(e => e.value)]
    this.rsiChart.data.labels = [...this.rsiData.map(e => new Date(e.time).toLocaleTimeString())]
    this.rsiChart.update() */



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
  }

  addLineDialogRef: any
  listOfAddedLines: lineType[] = []
  addLineToGraph() {
    this.addLineDialogRef = this.dialog.open(this.addLineTemplate, {
      width: '500px',
      enterAnimationDuration: 0,
      exitAnimationDuration: 0
    });
    this.addLineDialogRef.afterClosed().subscribe(async (result: any) => {
      if (result.length > 0) {
        console.log(result)
        this.listOfAddedLines = result
        this.addNewLinesToGraph(result)
      }
      else if (this.stockChart.data.datasets.length > 1) {
        this.listOfAddedLines = []
        this.stockChart.data.datasets = [this.stockChart.data.datasets[0]]
        this.stockChart.update()
      }

    });
  }
  listOfBGCOlors: string[] = ['#1ca0de', '#eeb528', '#d82c2c', '#00BFFF', '#A8FF60', '#FF2ECC', '#FFD700', '#00FFFF', '#FF7F7F', '#DA70D6', '#FFA500', '#98FF98', '#C3B1E1']
  addNewLinesToGraph(lines: lineType[]) {
    let linesNew = structuredClone(lines)
    this.stockChart.data.datasets = [this.stockChart.data.datasets[0]]
    this.listOfAddedLines = this.listOfAddedLines.filter(e => e.lineType != 'Price' && e.id != -10 && e.id != -11 && e.id != -12)
    linesNew = linesNew.filter(e => e.lineType != 'Price' && e.id != -10 && e.id != -11 && e.id != -12)
    let priceData: LineData[] = []
    for (let i = 0; i < this.stockDataForSelectedDay.length; i++) {
      priceData.push({ value: this.stockDataForSelectedDay[i].stockPrice, time: this.stockDataForSelectedDay[i].time })
    }
    this.listOfAddedLines.push({
      lineType: 'Price',
      lineLength: 1,
      id: -1,
      data: priceData
    })

    for (let i = 0; i < linesNew.length; i++) {
      let lineData: LineData[] = []
      if (linesNew[i].lineType == 'SMA') {
        lineData = this.calculateSMA(linesNew[i].lineLength)
        let filteredLine = this.listOfAddedLines.filter(e => e.id == linesNew[i].id)[0]
        filteredLine.data = lineData
      }
      else if (linesNew[i].lineType == 'EMA') {
        lineData = this.calculateEMA(linesNew[i].lineLength)
        let filteredLine = this.listOfAddedLines.filter(e => e.id == linesNew[i].id)[0]
        filteredLine.data = lineData
      }
      else if (linesNew[i].lineType == 'Cumulative VWAP') {
        lineData = this.calculateCumulativeVWAP();
        let filteredLine = this.listOfAddedLines.filter(e => e.id == linesNew[i].id)[0]
        filteredLine.data = lineData
      }
      else if (linesNew[i].lineType == 'Rolling VWAP') {
        lineData = this.calculateRollingVWAP(linesNew[i].lineLength);
        let filteredLine = this.listOfAddedLines.filter(e => e.id == linesNew[i].id)[0]
        filteredLine.data = lineData
      }
      else if (linesNew[i].lineType == 'Cumulative SMA') {
        lineData = this.calculateCumulativeSMA()
        let filteredLine = this.listOfAddedLines.filter(e => e.id == linesNew[i].id)[0]
        filteredLine.data = lineData
      }
      else if (linesNew[i].lineType == 'Cumulative EMA') {
        lineData = this.calculateCumulativeEMA()
        let filteredLine = this.listOfAddedLines.filter(e => e.id == linesNew[i].id)[0]
        filteredLine.data = lineData
      }


      if (linesNew[i].lineType == 'Bollinger Bands') {
        let bollingerData: LineData[][] = this.calculateBollingerBands(linesNew[i].lineLength)
        //let filteredLine = this.listOfAddedLines.filter(e => e.id == linesNew[i].id)[0]
        //filteredLine.data = lineData
        this.listOfAddedLines.push({
          id: -10,
          lineType: 'Bollinger Band EMA',
          lineLength: linesNew[i].lineLength,
          data: bollingerData[0]
        })
        this.listOfAddedLines.push({
          id: -11,
          lineType: 'Bollinger Band Upper',
          lineLength: linesNew[i].lineLength,
          data: bollingerData[1]
        })
        this.listOfAddedLines.push({
          id: -12,
          lineType: 'Bollinger Band Lower',
          lineLength: linesNew[i].lineLength,
          data: bollingerData[2]
        })
        this.stockChart.data.datasets.push({
          label: linesNew[i].lineType + ' - ' + linesNew[i].lineLength + ' EMA',
          data: bollingerData[0].map(e => e.value),
          backgroundColor: this.listOfBGCOlors[i],
          hoverBackgroundColor: this.listOfBGCOlors[i],
          borderColor: this.listOfBGCOlors[i],
          pointBackgroundColor: this.listOfBGCOlors[i],
          pointBorderColor: this.listOfBGCOlors[i],
          pointRadius: 0,
          spanGaps: true
        })
        this.stockChart.data.datasets.push({
          label: linesNew[i].lineType + ' - ' + linesNew[i].lineLength + ' Upper',
          data: bollingerData[1].map(e => e.value),
          backgroundColor: this.listOfBGCOlors[i],
          hoverBackgroundColor: this.listOfBGCOlors[i],
          borderColor: this.listOfBGCOlors[i],
          pointBackgroundColor: this.listOfBGCOlors[i],
          pointBorderColor: this.listOfBGCOlors[i],
          pointRadius: 0,
          spanGaps: true
        })
        this.stockChart.data.datasets.push({
          label: linesNew[i].lineType + ' - ' + linesNew[i].lineLength + ' Lower',
          data: bollingerData[2].map(e => e.value),
          backgroundColor: this.listOfBGCOlors[i],
          hoverBackgroundColor: this.listOfBGCOlors[i],
          borderColor: this.listOfBGCOlors[i],
          pointBackgroundColor: this.listOfBGCOlors[i],
          pointBorderColor: this.listOfBGCOlors[i],
          pointRadius: 0,
          spanGaps: true
        })
      }
      else {
        this.stockChart.data.datasets.push({
          label: linesNew[i].lineType + ' - ' + linesNew[i].lineLength,
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
    }

    this.stockChart.update()
  }
  addNewLinesToGraphNew() {
    this.stockChart.data.datasets = [this.stockChart.data.datasets[0]]
    let newListOfAddedLines = structuredClone(this.listOfAddedLines)
    newListOfAddedLines = newListOfAddedLines.filter(e => e.lineType != 'Price' && e.id != -10 && e.id != -11 && e.id != -12)
    let priceData: LineData[] = []
    for (let i = 0; i < this.stockDataForSelectedDay.length; i++) {
      priceData.push({ value: this.stockDataForSelectedDay[i].stockPrice, time: this.stockDataForSelectedDay[i].time })
    }
    newListOfAddedLines.push({
      lineType: 'Price',
      lineLength: 1,
      id: -1,
      data: priceData
    })

    for (let i = 0; i < newListOfAddedLines.length; i++) {
      let lineData: LineData[] = []
      if (newListOfAddedLines[i].lineType == 'SMA') {
        lineData = this.calculateSMA(newListOfAddedLines[i].lineLength)
        let filteredLine = newListOfAddedLines.filter(e => e.id == newListOfAddedLines[i].id)[0]
        filteredLine.data = lineData
      }
      else if (newListOfAddedLines[i].lineType == 'EMA') {
        lineData = this.calculateEMA(newListOfAddedLines[i].lineLength)
        let filteredLine = newListOfAddedLines.filter(e => e.id == newListOfAddedLines[i].id)[0]
        filteredLine.data = lineData
      }
      else if (newListOfAddedLines[i].lineType == 'Cumulative VWAP') {
        lineData = this.calculateCumulativeVWAP();
        let filteredLine = newListOfAddedLines.filter(e => e.id == newListOfAddedLines[i].id)[0]
        filteredLine.data = lineData
      }
      else if (newListOfAddedLines[i].lineType == 'Rolling VWAP') {
        lineData = this.calculateRollingVWAP(newListOfAddedLines[i].lineLength);
        let filteredLine = newListOfAddedLines.filter(e => e.id == newListOfAddedLines[i].id)[0]
        filteredLine.data = lineData
      }
      else if (newListOfAddedLines[i].lineType == 'Cumulative SMA') {
        lineData = this.calculateCumulativeSMA()
        let filteredLine = newListOfAddedLines.filter(e => e.id == newListOfAddedLines[i].id)[0]
        filteredLine.data = lineData
      }
      else if (newListOfAddedLines[i].lineType == 'Cumulative EMA') {
        lineData = this.calculateCumulativeEMA()
        let filteredLine = newListOfAddedLines.filter(e => e.id == newListOfAddedLines[i].id)[0]
        filteredLine.data = lineData
      }
      this.listOfAddedLines = newListOfAddedLines

      let rules = structuredClone(this.listOfAddedRules)

      for (let i = 0; i < rules.BuyRules.length; i++) {
        if (rules.BuyRules[i].primaryObject.type != "") {
          let filteredLine = this.listOfAddedLines.filter(e => e.lineType == rules.BuyRules[i].primaryObject.type && e.lineLength == rules.BuyRules[i].primaryObject.length)[0]
          console.log(filteredLine)
          console.log(rules.BuyRules[i].primaryObject.length)
          rules.BuyRules[i].primaryObject.data = filteredLine.data
        }
        if (rules.BuyRules[i].referencedObject.type != "") {
          let filteredLine = this.listOfAddedLines.filter(e => e.lineType == rules.BuyRules[i].referencedObject.type && e.lineLength == rules.BuyRules[i].referencedObject.length)[0]
          rules.BuyRules[i].referencedObject.data = filteredLine.data
        }

      }
      for (let i = 0; i < rules.SellRules.length; i++) {
        if (rules.SellRules[i].primaryObject.type != "") {
          let filteredLine = this.listOfAddedLines.filter(e => e.lineType == rules.SellRules[i].primaryObject.type && e.lineLength == rules.SellRules[i].primaryObject.length)[0]
          rules.SellRules[i].primaryObject.data = filteredLine.data
        }
        if (rules.SellRules[i].referencedObject.type != "") {
          let filteredLine = this.listOfAddedLines.filter(e => e.lineType == rules.SellRules[i].referencedObject.type && e.lineLength == rules.SellRules[i].referencedObject.length)[0]
          rules.SellRules[i].referencedObject.data = filteredLine.data
        }

      }

      this.listOfAddedRules = rules


      /* if (this.listOfAddedLines[i].lineType == 'Bollinger Bands') {
        let bollingerData: LineData[][] = this.calculateBollingerBands(this.listOfAddedLines[i].lineLength)
        //let filteredLine = this.listOfAddedLines.filter(e => e.id == linesNew[i].id)[0]
        //filteredLine.data = lineData
        this.listOfAddedLines.push({
          id: -10,
          lineType: 'Bollinger Band EMA',
          lineLength: this.listOfAddedLines[i].lineLength,
          data: bollingerData[0]
        })
        this.listOfAddedLines.push({
          id: -11,
          lineType: 'Bollinger Band Upper',
          lineLength: this.listOfAddedLines[i].lineLength,
          data: bollingerData[1]
        })
        this.listOfAddedLines.push({
          id: -12,
          lineType: 'Bollinger Band Lower',
          lineLength: this.listOfAddedLines[i].lineLength,
          data: bollingerData[2]
        })
        this.stockChart.data.datasets.push({
          label: this.listOfAddedLines[i].lineType + ' - ' + this.listOfAddedLines[i].lineLength + ' EMA',
          data: bollingerData[0].map(e => e.value),
          backgroundColor: this.listOfBGCOlors[i],
          hoverBackgroundColor: this.listOfBGCOlors[i],
          borderColor: this.listOfBGCOlors[i],
          pointBackgroundColor: this.listOfBGCOlors[i],
          pointBorderColor: this.listOfBGCOlors[i],
          pointRadius: 0,
          spanGaps: true
        })
        this.stockChart.data.datasets.push({
          label: this.listOfAddedLines[i].lineType + ' - ' + this.listOfAddedLines[i].lineLength + ' Upper',
          data: bollingerData[1].map(e => e.value),
          backgroundColor: this.listOfBGCOlors[i],
          hoverBackgroundColor: this.listOfBGCOlors[i],
          borderColor: this.listOfBGCOlors[i],
          pointBackgroundColor: this.listOfBGCOlors[i],
          pointBorderColor: this.listOfBGCOlors[i],
          pointRadius: 0,
          spanGaps: true
        })
        this.stockChart.data.datasets.push({
          label: this.listOfAddedLines[i].lineType + ' - ' + this.listOfAddedLines[i].lineLength + ' Lower',
          data: bollingerData[2].map(e => e.value),
          backgroundColor: this.listOfBGCOlors[i],
          hoverBackgroundColor: this.listOfBGCOlors[i],
          borderColor: this.listOfBGCOlors[i],
          pointBackgroundColor: this.listOfBGCOlors[i],
          pointBorderColor: this.listOfBGCOlors[i],
          pointRadius: 0,
          spanGaps: true
        })
      }
      else {
        this.stockChart.data.datasets.push({
          label: this.listOfAddedLines[i].lineType + ' - ' + this.listOfAddedLines[i].lineLength,
          data: lineData.map(e => e.value),
          backgroundColor: this.listOfBGCOlors[i],
          hoverBackgroundColor: this.listOfBGCOlors[i],
          borderColor: this.listOfBGCOlors[i],
          pointBackgroundColor: this.listOfBGCOlors[i],
          pointBorderColor: this.listOfBGCOlors[i],
          pointRadius: 0,
          spanGaps: true
        })
      } */
    }

    //this.stockChart.update()
  }

  calculateSMA(lineLength: number): LineData[] {
    let returnData: LineData[] = []
    let windowSum = 0
    for (let i = 0; i < lineLength - 1; i++) {
      returnData.push({ value: null, time: this.stockDataForSelectedDay[i].time })
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    windowSum += this.stockDataForSelectedDay[lineLength - 1].stockPrice
    returnData.push({ value: windowSum / lineLength, time: this.stockDataForSelectedDay[lineLength - 1].time })
    for (let j = lineLength; j < this.stockDataForSelectedDay.length; j++) {
      windowSum += this.stockDataForSelectedDay[j].stockPrice - this.stockDataForSelectedDay[j - lineLength].stockPrice
      returnData.push({ value: windowSum / lineLength, time: this.stockDataForSelectedDay[j].time })
    }

    return returnData



  }
  calculateEMA(lineLength: number): LineData[] {
    let returnData: LineData[] = []
    let windowSum = 0
    for (let i = 0; i < lineLength - 1; i++) {
      returnData.push({ value: null, time: this.stockDataForSelectedDay[i].time })
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    windowSum += this.stockDataForSelectedDay[lineLength - 1].stockPrice
    returnData.push({ value: windowSum / lineLength, time: this.stockDataForSelectedDay[lineLength - 1].time })

    let multiplyFactor = 2 / (lineLength + 1)
    for (let i = lineLength; i < this.stockDataForSelectedDay.length; i++) {
      let newVal = (this.stockDataForSelectedDay[i].stockPrice * multiplyFactor) + (returnData[returnData.length - 1].value! * (1 - multiplyFactor))
      returnData.push({ value: newVal, time: this.stockDataForSelectedDay[i].time })
    }
    return returnData
  }
  calculateCumulativeVWAP(): LineData[] {
    let returnData: LineData[] = []
    let cumulativePV = 0;
    let cumulativeVolume = 0;
    for (let i = 0; i < this.stockDataForSelectedDay.length; i++) {
      cumulativePV += this.stockDataForSelectedDay[i].stockPrice * this.stockDataForSelectedDay[i].volume;
      cumulativeVolume += this.stockDataForSelectedDay[i].volume;
      const vwap = cumulativePV / cumulativeVolume;
      returnData.push({ value: vwap, time: this.stockDataForSelectedDay[i].time });
    }

    return returnData
  }
  calculateRollingVWAP(lineLength: number): LineData[] {
    let returnData: LineData[] = []
    let cumulativePV = 0;
    let cumulativeVolume = 0;
    for (let i = 0; i < lineLength - 1; i++) {
      cumulativePV += this.stockDataForSelectedDay[i].stockPrice * this.stockDataForSelectedDay[i].volume
      cumulativeVolume += this.stockDataForSelectedDay[i].volume
      returnData.push({ value: null, time: this.stockDataForSelectedDay[i].time })
    }
    cumulativePV += this.stockDataForSelectedDay[lineLength - 1].stockPrice * this.stockDataForSelectedDay[lineLength - 1].volume
    cumulativeVolume += this.stockDataForSelectedDay[lineLength - 1].volume
    returnData.push({ value: cumulativePV / cumulativeVolume, time: this.stockDataForSelectedDay[lineLength - 1].time });
    for (let i = lineLength; i < this.stockDataForSelectedDay.length; i++) {
      cumulativePV += (this.stockDataForSelectedDay[i].stockPrice * this.stockDataForSelectedDay[i].volume) - (this.stockDataForSelectedDay[i - lineLength].stockPrice * this.stockDataForSelectedDay[i - lineLength].volume);
      cumulativeVolume += this.stockDataForSelectedDay[i].volume - this.stockDataForSelectedDay[i - lineLength].volume;
      const vwap = cumulativePV / cumulativeVolume;
      returnData.push({ value: vwap, time: this.stockDataForSelectedDay[i].time });
    }

    return returnData
  }

  calculateBollingerBands(lineLength: number): LineData[][] {
    this.count = 0
    let returnData: LineData[][] = []
    let averageData: LineData[] = []
    returnData.push(averageData)
    let upperData: LineData[] = []
    returnData.push(upperData)
    let lowerData: LineData[] = []
    returnData.push(lowerData)
    let windowSum = 0
    let mean = 0
    let window: number[] = []
    let listOfDeviations: number[] = []
    let averageOfSqDev: number = 0
    let standardDeviation: number = 0
    for (let i = 0; i < lineLength - 1; i++) {
      window.push(this.stockDataForSelectedDay[i].stockPrice)
      returnData[0].push({ value: null, time: this.stockDataForSelectedDay[i].time })
      returnData[1].push({ value: null, time: this.stockDataForSelectedDay[i].time })
      returnData[2].push({ value: null, time: this.stockDataForSelectedDay[i].time })
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    windowSum += this.stockDataForSelectedDay[lineLength - 1].stockPrice
    window.push(this.stockDataForSelectedDay[lineLength - 1].stockPrice)
    mean = windowSum / lineLength
    for (let i = 0; i < window.length; i++) {
      listOfDeviations.push((window[i] - mean) * (window[i] - mean))
    }
    averageOfSqDev = listOfDeviations.reduce((sum, val) => sum + val, 0) / listOfDeviations.length
    standardDeviation = Math.sqrt(averageOfSqDev)

    returnData[0].push({ value: windowSum / lineLength, time: this.stockDataForSelectedDay[lineLength - 1].time })
    returnData[1].push({ value: (windowSum / lineLength) + (2 * standardDeviation), time: this.stockDataForSelectedDay[lineLength - 1].time })
    returnData[2].push({ value: (windowSum / lineLength) - (2 * standardDeviation), time: this.stockDataForSelectedDay[lineLength - 1].time })

    let multiplyFactor = 2 / (lineLength + 1)
    for (let i = lineLength; i < this.stockDataForSelectedDay.length; i++) {
      listOfDeviations.length = 0
      window.shift()
      window.push(this.stockDataForSelectedDay[i].stockPrice)
      let newVal = (this.stockDataForSelectedDay[i].stockPrice * multiplyFactor) + (returnData[0][returnData[0].length - 1].value! * (1 - multiplyFactor))
      returnData[0].push({ value: newVal, time: this.stockDataForSelectedDay[i].time })
      let sumOfWindow = window.reduce((sum, val) => sum + val, 0)
      mean = sumOfWindow / lineLength
      for (let j = 0; j < window.length; j++) {
        listOfDeviations.push((window[j] - mean) * (window[j] - mean))
      }
      averageOfSqDev = listOfDeviations.reduce((sum, val) => sum + val, 0) / listOfDeviations.length
      standardDeviation = Math.sqrt(averageOfSqDev)
      returnData[1].push({ value: newVal + (2 * standardDeviation), time: this.stockDataForSelectedDay[i].time })
      returnData[2].push({ value: newVal - (2 * standardDeviation), time: this.stockDataForSelectedDay[i].time })
      if (this.count == 0) {
        console.log({
          window: window,
          sumOfWindow: sumOfWindow,
          mean: mean,
          listOfDeviations: listOfDeviations,
          averageOfSqDev: averageOfSqDev,
          standardDeviation: standardDeviation,
          newVal: newVal
        })
        this.count++
      }
    }
    return returnData
  }
  calculateCumulativeSMA(): LineData[] {
    let returnData: LineData[] = []
    let cumulativePrice: number = 0
    for (let i = 0; i < this.stockDataForSelectedDay.length; i++) {
      cumulativePrice += this.stockDataForSelectedDay[i].stockPrice
      const sma = cumulativePrice / (i + 1);
      returnData.push({ value: sma, time: this.stockDataForSelectedDay[i].time });
    }

    return returnData
  }
  calculateCumulativeEMA(): LineData[] {
    let returnData: LineData[] = []
    returnData.push({ value: this.stockDataForSelectedDay[0].stockPrice, time: this.stockDataForSelectedDay[0].time })

    for (let i = 1; i < this.stockDataForSelectedDay.length; i++) {
      let multiplyFactor = 2 / (i + 1)
      let newVal = (this.stockDataForSelectedDay[i].stockPrice * multiplyFactor) + (returnData[returnData.length - 1].value! * (1 - multiplyFactor))
      returnData.push({ value: newVal, time: this.stockDataForSelectedDay[i].time })
    }

    return returnData
  }

  addRuleDialogRef: any
  listOfAddedRules: RuleDto = {
    BuyRules: [],
    SellRules: [],
    NumberOfLossesInARowToStop: 0,
    TimeOutAfterStopLossSell: 0
  }
  addRuleToGraph() {
    this.addRuleDialogRef = this.dialog.open(this.addRuleTemplate, {
      width: '1200px',
      enterAnimationDuration: 0,
      exitAnimationDuration: 0
    });
    this.addRuleDialogRef.afterClosed().subscribe(async (result: any) => {
      console.log(result)
      //this.addRule(result)
      /* 
      else if (this.stockChart.data.datasets.length > 1) {
        this.listOfAddedLines = []
        this.stockChart.data.datasets = [this.stockChart.data.datasets[0]]
        this.stockChart.update()
      } */

    });
  }
  algoLoopDialogRef: any
  algoLoopPopup() {
    this.algoLoopDialogRef = this.dialog.open(this.algoLoopTemplate, {
      width: '1200px',
      enterAnimationDuration: 0,
      exitAnimationDuration: 0
    });
    this.algoLoopDialogRef.afterClosed().subscribe(async (result: any) => {
      console.log(result)
      //this.addRule(result)
      /* 
      else if (this.stockChart.data.datasets.length > 1) {
        this.listOfAddedLines = []
        this.stockChart.data.datasets = [this.stockChart.data.datasets[0]]
        this.stockChart.update()
      } */

    });
  }


  operators: Record<string, OperatorFunction> = {
    "Crosses above:": (rule, index) => (rule.primaryObject.data[index].value == null || rule.referencedObject.data[index].value == null) ? false : (rule.primaryObject.data[index].value > rule.referencedObject.data[index].value && (rule.primaryObject.data[index - 1].value != null && rule.referencedObject.data[index - 1].value != null) && (rule.primaryObject.data[index - 1].value! <= rule.referencedObject.data[index - 1].value!)),
    "Crosses below:": (rule, index) => (rule.primaryObject.data[index].value == null || rule.referencedObject.data[index].value == null) ? false : (rule.primaryObject.data[index].value < rule.referencedObject.data[index].value && (rule.primaryObject.data[index - 1].value != null && rule.referencedObject.data[index - 1].value != null) && (rule.primaryObject.data[index - 1].value! >= rule.referencedObject.data[index - 1].value!)),
    "Dips below:": (rule, index) => (rule.primaryObject.data[index].value == null || rule.referencedObject.data[index].value == null) ? false : (((rule.primaryObject.data[index].value - rule.referencedObject.data[index].value) / rule.referencedObject.data[index].value) < (rule.desiredAction.amount * -1)),
    "Rises above:": (rule, index) => (rule.primaryObject.data[index].value == null || rule.referencedObject.data[index].value == null) ? false : (((rule.primaryObject.data[index].value - rule.referencedObject.data[index].value) / rule.referencedObject.data[index].value) > (rule.desiredAction.amount)),
    "Take Profit": (rule, index, buyPrice) => (this.stockDataForSelectedDay[index].stockPrice >= (buyPrice! * (1 + rule.desiredAction.amount))),
    "Stop Loss": (rule, index, buyPrice) => (this.stockDataForSelectedDay[index].stockPrice <= (buyPrice! * (1 - rule.desiredAction.amount))),
    "After": (rule, index) => ('buyTime' in rule ? (this.stockDataForSelectedDay[index].time > (this.stockDataForSelectedDay[0].time + (rule.buyTime * 1000 * 60))) : false),
    "Trailing Stop": (rule, index) => ('current' in rule.desiredAction ? (this.stockDataForSelectedDay[index].stockPrice <= rule.desiredAction.current) : false),
    "Trend Crosses Below:": (rule, index) => ((index >= (rule.primaryObject.length + rule.desiredAction.length) - 2) ? (this.getTrend(rule.primaryObject.data, rule.desiredAction.length, index) < rule.desiredAction.amount) : false),
    "Trend Crosses Above:": (rule, index) => ((index >= (rule.primaryObject.length + rule.desiredAction.length) - 2) ? (this.getTrend(rule.primaryObject.data, rule.desiredAction.length, index) > rule.desiredAction.amount) : false),
    "Is greater than:": (rule, index) => (rule.primaryObject.data[index].value == null || rule.referencedObject.data[index].value == null) ? false : (rule.primaryObject.data[index].value > rule.referencedObject.data[index].value),
    "Is less than:": (rule, index) => (rule.primaryObject.data[index].value == null || rule.referencedObject.data[index].value == null) ? false : (rule.primaryObject.data[index].value < rule.referencedObject.data[index].value)
  };

  addRule() {

    let counter = 0
    for (let i = 0; i < this.listOfAddedLines.length; i++) {
      if (this.listOfAddedLines[i].lineLength > counter) {
        counter = this.listOfAddedLines[i].lineLength
      }
    }
    counter = counter - 1

    let buySell = 'Buy'
    let orderLocations: orderLocation[] = []
    let profit = 0
    let numberOfConsecutiveLosses = 0
    let timeOutPeriod = 0

    for (let i = counter; i < this.stockDataForSelectedDay.length; i++) {
      if (buySell == 'Buy') {
        let buyArray = []
        for (let j = 0; j < this.listOfAddedRules.BuyRules.length; j++) {
          buyArray.push(this.operators[this.listOfAddedRules.BuyRules[j].desiredAction.type](this.listOfAddedRules.BuyRules[j], i))
        }
        if (!buyArray.includes(false) && this.stockDataForSelectedDay[i].time >= timeOutPeriod && numberOfConsecutiveLosses < this.listOfAddedRules.NumberOfLossesInARowToStop) {
          orderLocations.push({ buySell: 'Buy', price: this.stockDataForSelectedDay[i].stockPrice, date: this.stockDataForSelectedDay[i].time, dateString: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() })
          buySell = 'Sell'
          for (let j = 0; j < this.listOfAddedRules.SellRules.length; j++) {
            if (this.listOfAddedRules.SellRules[j].desiredAction.type == 'Trailing Stop') {
              this.listOfAddedRules.SellRules[j].desiredAction.current = 0
              this.listOfAddedRules.SellRules[j].tradeHigh = this.stockDataForSelectedDay[i].stockPrice
            }
          }
        }
      }
      else {
        let buyArray = []

        let andOr = 'And'
        for (let j = 0; j < this.listOfAddedRules.SellRules.length; j++) {
          if (this.listOfAddedRules.SellRules[j].desiredAction.type == 'Trailing Stop' && (this.stockDataForSelectedDay[i].stockPrice > this.listOfAddedRules.SellRules[j].tradeHigh)) {
            this.listOfAddedRules.SellRules[j].tradeHigh = this.stockDataForSelectedDay[i].stockPrice
            if (this.listOfAddedRules.SellRules[j].tradeHigh >= (orderLocations[orderLocations.length - 1].price + this.listOfAddedRules.SellRules[j].desiredAction.amount)) {
              this.listOfAddedRules.SellRules[j].desiredAction.current = this.listOfAddedRules.SellRules[j].tradeHigh - this.listOfAddedRules.SellRules[j].desiredAction.amount
            }
          }
          buyArray.push(this.operators[this.listOfAddedRules.SellRules[j].desiredAction.type](this.listOfAddedRules.SellRules[j], i, orderLocations[orderLocations.length - 1].price))
        }
        if (this.listOfAddedRules.SellRules[this.listOfAddedRules.SellRules.length - 1].andOr == 'Or') {
          andOr = 'Or'
        }
        if (i == this.stockDataForSelectedDay.length - 1) {
          orderLocations.push({ buySell: 'Sell', price: this.stockDataForSelectedDay[i].stockPrice, date: this.stockDataForSelectedDay[i].time, dateString: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() })
          profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
          buySell = 'Buy'
        }
        else {
          if (andOr == 'Or') {
            if (buyArray.includes(true)) {
              orderLocations.push({ buySell: 'Sell', price: this.stockDataForSelectedDay[i].stockPrice, date: this.stockDataForSelectedDay[i].time, dateString: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() })
              profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
              if (profit < 0) {
                numberOfConsecutiveLosses++
                timeOutPeriod = (this.listOfAddedRules.TimeOutAfterStopLossSell * 60000) + this.stockDataForSelectedDay[i].time
              }
              buySell = 'Buy'
            }
          }
          else {
            if (!buyArray.includes(false)) {
              orderLocations.push({ buySell: 'Sell', price: this.stockDataForSelectedDay[i].stockPrice, date: this.stockDataForSelectedDay[i].time, dateString: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() })
              profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
              if (profit < 0) {
                numberOfConsecutiveLosses++
                timeOutPeriod = (this.listOfAddedRules.TimeOutAfterStopLossSell * 60000) + this.stockDataForSelectedDay[i].time
              }
              buySell = 'Buy'
            }
          }
        }


      }
    }
    return { orderLocations: orderLocations, profit: profit }


  }
  refreshRules() {
    for (let i = 0; i < this.listOfAddedRules.BuyRules.length; i++) {
      let filteredLineData = this.listOfAddedLines.filter(e => e.lineType == this.listOfAddedRules.BuyRules[i].primaryObject.type && e.lineLength == this.listOfAddedRules.BuyRules[i].primaryObject.length)
      if (filteredLineData.length > 0) {
        this.listOfAddedRules.BuyRules[i].primaryObject.data = filteredLineData[0].data
      }
      filteredLineData = this.listOfAddedLines.filter(e => e.lineType == this.listOfAddedRules.BuyRules[i].referencedObject.type && e.lineLength == this.listOfAddedRules.BuyRules[i].referencedObject.length)
      if (filteredLineData.length > 0) {
        this.listOfAddedRules.BuyRules[i].referencedObject.data = filteredLineData[0].data
      }

    }
    for (let i = 0; i < this.listOfAddedRules.SellRules.length; i++) {
      let filteredLineData = this.listOfAddedLines.filter(e => e.lineType == this.listOfAddedRules.SellRules[i].primaryObject.type && e.lineLength == this.listOfAddedRules.SellRules[i].primaryObject.length)
      if (filteredLineData.length > 0) {
        this.listOfAddedRules.SellRules[i].primaryObject.data = filteredLineData[0].data
      }
      filteredLineData = this.listOfAddedLines.filter(e => e.lineType == this.listOfAddedRules.SellRules[i].referencedObject.type && e.lineLength == this.listOfAddedRules.SellRules[i].referencedObject.length)
      if (filteredLineData.length > 0) {
        this.listOfAddedRules.SellRules[i].referencedObject.data = filteredLineData[0].data
      }
    }
  }

  count = 0
  getTrend(data: LineData[], length: number, index: number): number {
    let trend = 0


    /* let sumOfTime = selectedData.reduce((sum, val) => sum + val.time, 0)
    let sumOfValue = selectedData.reduce((sum, val) => sum + val.value!, 0)
    let sumOfTimeSquared = selectedData.reduce((sum, val) => sum + (val.time * val.time), 0)
    let sumOfTimeValue = selectedData.reduce((sum, val) => sum + (val.time * val.value!), 0) */



    //trend = ((length * sumOfTimeValue) - (sumOfTime * sumOfValue)) / ((length * sumOfTimeSquared) - (sumOfTime * sumOfTime))
    trend = (data[index].value! - data[index - length].value!) / length
    if (this.count == 1) {
      console.log(index - length)
      console.log(trend)
      this.count++
    }
    return trend
  }

  async ngOnInit() {
    Chart.register(annotationPlugin);
    Chart.register(...registerables)
    Chart.register(zoomPlugin)
    this.isLoading = true
    this.allHistory = await dbStockBasicHistoryRepo.find({ where: {}, orderBy: { stockName: 'asc', date: 'asc' } })
    this.distinctStocks = this.allHistory.map(e => e.stockName).filter((v, i, a) => a.indexOf(v) === i)
    this.selectedStockName = this.distinctStocks[0]
    this.selectedInterDayStockData = this.allHistory.filter(e => e.stockName == this.selectedStockName)
    console.log(this.selectedInterDayStockData)
    this.interDayLongSma = 200
    this.interDayMediumSma = 40
    this.interDayShortSma = 5
    this.createOrUpdateChart()
    this.createOrUpdateRsiChart()
    //this.runSimulation()
    this.calcualateIntraDayRsi()
    await this.getStockHistoricalData()
    //await this.getStockBasicHistoryData();
    let today = new Date()
    today.setHours(5, 0, 0, 0)
    let listOfOrders = await dbOrdersRepo.find({ where: { orderTime: { $gt: today.getTime() } }, orderBy: { orderTime: 'asc' } })
    console.log(listOfOrders)
    this.isLoading = false;

  }
}
