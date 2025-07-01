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
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { LogService } from '../services/LogService';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { tickerRepo, tickers } from '../../shared/tasks/tickers';
import { map, Observable, startWith } from 'rxjs';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { PolygonController } from '../../shared/controllers/PolygonController';


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
type nonLineValues = {
  uId: string;
  value: number;
}

@Component({
  selector: 'app-server-trade-screen',
  imports: [MatCheckboxModule, MatDatepickerModule, ReactiveFormsModule, MatAutocompleteModule, CommonModule, MatTableModule, MatIconModule, MatProgressSpinnerModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatInputModule, FormsModule, MatSlideToggleModule, AddLineComponent, AddRuleComponent, AlgoLoopComponent],
  templateUrl: './server-trade-screen.component.html',
  providers: [provideNativeDateAdapter()],
  styleUrl: './server-trade-screen.component.css'
})

export class ServerTradeScreenComponent implements OnInit {
  stateCtrl = new FormControl('');
  filteredStocks: Observable<tickers[]>;
  constructor() {
    this.filteredStocks = this.stateCtrl.valueChanges.pipe(
      startWith(''),
      map(stock => (stock ? this._filterStocks(stock) : this.distinctStocks.slice())),
    );
  }
  isLoading: boolean = false;
  listOfServerAlgos: serverAlgos[] = []
  userAlgos: DbAlgorithmList | undefined = undefined
  allHistory: DbStockBasicHistory[] = []
  selectedInterDayStockData: DbStockBasicHistory[] = []
  longSmaResults: sma200Array[] = []
  mediumSmaResults: sma200Array[] = []
  shortSmaResults: sma200Array[] = []
  selectedStockName: string = ''
  stockChart: any;
  rsiChart: any;
  distinctStocks: tickers[] = []
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

  selectedStockData: DbStockBasicHistory[] | DbStockHistoryData[] = []

  interDayLongSma: number = 0;
  interDayMediumSma: number = 0
  interDayShortSma: number = 0
  stopLoss: number = 0
  readonly dialog = inject(MatDialog);
  @ViewChild('addLineTemplate', { static: true }) addLineTemplate!: TemplateRef<any>;
  @ViewChild('addRuleTemplate', { static: true }) addRuleTemplate!: TemplateRef<any>;
  @ViewChild('algoLoopTemplate', { static: true }) algoLoopTemplate!: TemplateRef<any>;

  private _filterStocks(value: string): tickers[] {
    const filterValue = value.toLowerCase();

    return this.distinctStocks.filter(stock => stock.name.toLowerCase().includes(filterValue));
  }
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
        this.selectedInterDayStockData = this.allHistory.filter(e => e.stockName = this.selectedStockName)
        //this.calculateSmaValuesInterDaySingleRun()
        this.updateChart()
        //this.runSimulation()
        this.isLoading = false
      }
      else {
        this.isLoading = true
        await this.getStockHistoricalData()
        await this.updateStockChartData(this.selectedDate)
        //this.calculateIntraDaySma()
        this.updateChartIntraDay()
        //this.updateVolumeChartIntraDay()
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
      //this.updateVolumeChartIntraDay()
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
      //this.runSimulation()
      this.isLoading = false
    }
  }
  resultsInfo: any[] = []
  resultsColums: string[] = ["Profit", "NoTrades", "Profit Factor", "Wins", "Losses", "AvgWinAmt", "AvgLossAmt", "Expectancy"]
  onRunSimulation() {
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
  }
  async runAlgoAllDaysWithLoop() {
    this.isLoading = true
    let rules = structuredClone(this.listOfAddedRules)
    console.log(rules)

    let finalResult = []
    if (this.intraDayChecked) {
      let exchange = this.distinctStocks.filter(e => e.name == this.selectedStockName)[0].exchange
      let currentDate = new Date()
      let loopDate = new Date(rules.StartDate)
      while (loopDate <= currentDate) {
        this.stockDataForSelectedDay = await PolygonController.getIntraDayDataCall(this.selectedStockName, loopDate.toISOString().split('T')[0], exchange)
        if (this.stockDataForSelectedDay.length > 0) {
          console.log(loopDate.toISOString().split('T')[0])
          let listOfBuyLines: { [key: number]: { length: number, data: LineData[] }[] } = {}
          for (let i = 0; i < rules.BuyRules.length; i++) {
            if (rules.BuyRules[i].primaryObject.length > 1 && rules.BuyRules[i].primaryObject.lengthLoopChecked) {
              if (listOfBuyLines[rules.BuyRules[i].primaryObject.lineId] == undefined) {
                listOfBuyLines[rules.BuyRules[i].primaryObject.lineId] = []
                let from = rules.BuyRules[i].primaryObject.lengthLoopCheckFromAmnt
                let to = rules.BuyRules[i].primaryObject.lengthLoopCheckToAmnt
                let step = rules.BuyRules[i].primaryObject.lengthLoopCheckStepAmnt
                for (let j = from; j <= to; j += step) {
                  if (rules.BuyRules[i].primaryObject.type == 'EMA') {
                    listOfBuyLines[rules.BuyRules[i].primaryObject.lineId].push({ length: j, data: this.calculateEMA(j) })
                  }
                  else if (rules.BuyRules[i].primaryObject.type == 'SMA') {
                    listOfBuyLines[rules.BuyRules[i].primaryObject.lineId].push({ length: j, data: this.calculateSMA(j) })
                  }
                  else if (rules.BuyRules[i].primaryObject.type == 'Rolling VWAP') {
                    listOfBuyLines[rules.BuyRules[i].primaryObject.lineId].push({ length: j, data: this.calculateRollingVWAP(j) })
                  }
                }
              }
            }
            else if ((listOfBuyLines[rules.BuyRules[i].primaryObject.lineId] == undefined && rules.BuyRules[i].primaryObject.length == 1)) {
              listOfBuyLines[rules.BuyRules[i].primaryObject.lineId] = []
              if (rules.BuyRules[i].primaryObject.type == 'Cumulative SMA') {
                listOfBuyLines[rules.BuyRules[i].primaryObject.lineId].push({ length: rules.BuyRules[i].primaryObject.length, data: this.calculateCumulativeSMA() })
              }
              else if (rules.BuyRules[i].primaryObject.type == 'Cumulative VWAP') {
                listOfBuyLines[rules.BuyRules[i].primaryObject.lineId].push({ length: rules.BuyRules[i].primaryObject.length, data: this.calculateCumulativeVWAP() })
              }
              //listOfBuyLines[rules.BuyRules[i].primaryObject.lineId].push({ length: rules.BuyRules[i].primaryObject.length, data: rules.BuyRules[i].primaryObject.data })
            }
            if (rules.BuyRules[i].referencedObject.length > 1 && rules.BuyRules[i].referencedObject.lengthLoopChecked) {
              if (listOfBuyLines[rules.BuyRules[i].referencedObject.lineId] == undefined) {
                listOfBuyLines[rules.BuyRules[i].referencedObject.lineId] = []
                let from = rules.BuyRules[i].referencedObject.lengthLoopCheckFromAmnt
                let to = rules.BuyRules[i].referencedObject.lengthLoopCheckToAmnt
                let step = rules.BuyRules[i].referencedObject.lengthLoopCheckStepAmnt
                for (let j = from; j <= to; j += step) {
                  if (rules.BuyRules[i].referencedObject.type == 'EMA') {
                    listOfBuyLines[rules.BuyRules[i].referencedObject.lineId].push({ length: j, data: this.calculateEMA(j) })
                  }
                  else if (rules.BuyRules[i].referencedObject.type == 'SMA') {
                    listOfBuyLines[rules.BuyRules[i].referencedObject.lineId].push({ length: j, data: this.calculateSMA(j) })
                  }
                  else if (rules.BuyRules[i].referencedObject.type == 'Rolling VWAP') {
                    listOfBuyLines[rules.BuyRules[i].referencedObject.lineId].push({ length: j, data: this.calculateRollingVWAP(j) })
                  }

                }
              }
            }
            else if ((listOfBuyLines[rules.BuyRules[i].referencedObject.lineId] == undefined && rules.BuyRules[i].referencedObject.length == 1)) {
              listOfBuyLines[rules.BuyRules[i].referencedObject.lineId] = []
              if (rules.BuyRules[i].referencedObject.type == 'Cumulative SMA') {
                listOfBuyLines[rules.BuyRules[i].referencedObject.lineId].push({ length: rules.BuyRules[i].referencedObject.length, data: this.calculateCumulativeSMA() })
              }
              else if (rules.BuyRules[i].referencedObject.type == 'Cumulative VWAP') {
                listOfBuyLines[rules.BuyRules[i].referencedObject.lineId].push({ length: rules.BuyRules[i].referencedObject.length, data: this.calculateCumulativeVWAP() })
              }
            }
          }

          for (let i = 0; i < rules.SellRules.length; i++) {
            if (rules.SellRules[i].primaryObject.length > 1 && rules.SellRules[i].primaryObject.lengthLoopChecked) {
              if (listOfBuyLines[rules.SellRules[i].primaryObject.lineId] == undefined) {
                listOfBuyLines[rules.SellRules[i].primaryObject.lineId] = []
                let from = rules.SellRules[i].primaryObject.lengthLoopCheckFromAmnt
                let to = rules.SellRules[i].primaryObject.lengthLoopCheckToAmnt
                let step = rules.SellRules[i].primaryObject.lengthLoopCheckStepAmnt
                for (let j = from; j <= to; j += step) {
                  if (rules.SellRules[i].primaryObject.type == 'EMA') {
                    listOfBuyLines[rules.SellRules[i].primaryObject.lineId].push({ length: j, data: this.calculateEMA(j) })
                  }
                  else if (rules.SellRules[i].primaryObject.type == 'SMA') {
                    listOfBuyLines[rules.SellRules[i].primaryObject.lineId].push({ length: j, data: this.calculateSMA(j) })
                  }
                  else if (rules.SellRules[i].primaryObject.type == 'Rolling VWAP') {
                    listOfBuyLines[rules.SellRules[i].primaryObject.lineId].push({ length: j, data: this.calculateRollingVWAP(j) })
                  }
                }
              }
            }
            else if ((listOfBuyLines[rules.SellRules[i].primaryObject.lineId] == undefined && rules.SellRules[i].primaryObject.length == 1)) {
              listOfBuyLines[rules.SellRules[i].primaryObject.lineId] = []
              if (rules.SellRules[i].primaryObject.type == 'Cumulative SMA') {
                listOfBuyLines[rules.SellRules[i].primaryObject.lineId].push({ length: rules.SellRules[i].primaryObject.length, data: this.calculateCumulativeSMA() })
              }
              else if (rules.SellRules[i].primaryObject.type == 'Cumulative VWAP') {
                listOfBuyLines[rules.SellRules[i].primaryObject.lineId].push({ length: rules.SellRules[i].primaryObject.length, data: this.calculateCumulativeVWAP() })
              }
            }
            if (rules.SellRules[i].referencedObject.length > 1 && rules.SellRules[i].referencedObject.lengthLoopChecked) {
              if (listOfBuyLines[rules.SellRules[i].referencedObject.lineId] == undefined) {
                listOfBuyLines[rules.SellRules[i].referencedObject.lineId] = []
                let from = rules.SellRules[i].referencedObject.lengthLoopCheckFromAmnt
                let to = rules.SellRules[i].referencedObject.lengthLoopCheckToAmnt
                let step = rules.SellRules[i].referencedObject.lengthLoopCheckStepAmnt
                for (let j = from; j <= to; j += step) {
                  if (rules.SellRules[i].referencedObject.type == 'EMA') {
                    listOfBuyLines[rules.SellRules[i].referencedObject.lineId].push({ length: j, data: this.calculateEMA(j) })
                  }
                  else if (rules.SellRules[i].referencedObject.type == 'SMA') {
                    listOfBuyLines[rules.SellRules[i].referencedObject.lineId].push({ length: j, data: this.calculateSMA(j) })
                  }
                  else if (rules.SellRules[i].referencedObject.type == 'Rolling VWAP') {
                    listOfBuyLines[rules.SellRules[i].referencedObject.lineId].push({ length: j, data: this.calculateRollingVWAP(j) })
                  }
                }
              }
            }
            else if ((listOfBuyLines[rules.SellRules[i].referencedObject.lineId] == undefined && rules.SellRules[i].referencedObject.length == 1)) {
              listOfBuyLines[rules.SellRules[i].referencedObject.lineId] = []
              if (rules.SellRules[i].referencedObject.type == 'Cumulative SMA') {
                listOfBuyLines[rules.SellRules[i].referencedObject.lineId].push({ length: rules.SellRules[i].referencedObject.length, data: this.calculateCumulativeSMA() })
              }
              else if (rules.SellRules[i].referencedObject.type == 'Cumulative VWAP') {
                listOfBuyLines[rules.SellRules[i].referencedObject.lineId].push({ length: rules.SellRules[i].referencedObject.length, data: this.calculateCumulativeVWAP() })
              }
            }
          }
          const allCombinations = this.generateCombinations(listOfBuyLines);
          console.log(listOfBuyLines)
          let result = this.addRule2(listOfBuyLines, allCombinations, rules)
          finalResult.push(result)
        }
        loopDate.setDate(loopDate.getDate() + 1);


      }

    }
    else {

      let listOfBuyLines: { [key: number]: { length: number, data: LineData[] }[] } = {}
      for (let i = 0; i < rules.BuyRules.length; i++) {
        if (rules.BuyRules[i].primaryObject.length > 1 && rules.BuyRules[i].primaryObject.lengthLoopChecked) {
          if (listOfBuyLines[rules.BuyRules[i].primaryObject.lineId] == undefined) {
            listOfBuyLines[rules.BuyRules[i].primaryObject.lineId] = []
            let from = rules.BuyRules[i].primaryObject.lengthLoopCheckFromAmnt
            let to = rules.BuyRules[i].primaryObject.lengthLoopCheckToAmnt
            let step = rules.BuyRules[i].primaryObject.lengthLoopCheckStepAmnt
            for (let j = from; j <= to; j += step) {
              if (rules.BuyRules[i].primaryObject.type == 'EMA') {
                listOfBuyLines[rules.BuyRules[i].primaryObject.lineId].push({ length: j, data: this.calculateEMA(j) })
              }
              else if (rules.BuyRules[i].primaryObject.type == 'SMA') {
                listOfBuyLines[rules.BuyRules[i].primaryObject.lineId].push({ length: j, data: this.calculateSMA(j) })
              }
              else if (rules.BuyRules[i].primaryObject.type == 'Rolling VWAP') {
                listOfBuyLines[rules.BuyRules[i].primaryObject.lineId].push({ length: j, data: this.calculateRollingVWAP(j) })
              }
            }
          }
        }
        else if ((listOfBuyLines[rules.BuyRules[i].primaryObject.lineId] == undefined && rules.BuyRules[i].primaryObject.length == 1)) {
          listOfBuyLines[rules.BuyRules[i].primaryObject.lineId] = []
          if (rules.BuyRules[i].primaryObject.type == 'Cumulative SMA') {
            listOfBuyLines[rules.BuyRules[i].primaryObject.lineId].push({ length: rules.BuyRules[i].primaryObject.length, data: this.calculateCumulativeSMA() })
          }
          else if (rules.BuyRules[i].primaryObject.type == 'Cumulative VWAP') {
            listOfBuyLines[rules.BuyRules[i].primaryObject.lineId].push({ length: rules.BuyRules[i].primaryObject.length, data: this.calculateCumulativeVWAP() })
          }
          //listOfBuyLines[rules.BuyRules[i].primaryObject.lineId].push({ length: rules.BuyRules[i].primaryObject.length, data: rules.BuyRules[i].primaryObject.data })
        }
        if (rules.BuyRules[i].referencedObject.length > 1 && rules.BuyRules[i].referencedObject.lengthLoopChecked) {
          if (listOfBuyLines[rules.BuyRules[i].referencedObject.lineId] == undefined) {
            listOfBuyLines[rules.BuyRules[i].referencedObject.lineId] = []
            let from = rules.BuyRules[i].referencedObject.lengthLoopCheckFromAmnt
            let to = rules.BuyRules[i].referencedObject.lengthLoopCheckToAmnt
            let step = rules.BuyRules[i].referencedObject.lengthLoopCheckStepAmnt
            for (let j = from; j <= to; j += step) {
              if (rules.BuyRules[i].referencedObject.type == 'EMA') {
                listOfBuyLines[rules.BuyRules[i].referencedObject.lineId].push({ length: j, data: this.calculateEMA(j) })
              }
              else if (rules.BuyRules[i].referencedObject.type == 'SMA') {
                listOfBuyLines[rules.BuyRules[i].referencedObject.lineId].push({ length: j, data: this.calculateSMA(j) })
              }
              else if (rules.BuyRules[i].referencedObject.type == 'Rolling VWAP') {
                listOfBuyLines[rules.BuyRules[i].referencedObject.lineId].push({ length: j, data: this.calculateRollingVWAP(j) })
              }

            }
          }
        }
        else if ((listOfBuyLines[rules.BuyRules[i].referencedObject.lineId] == undefined && rules.BuyRules[i].referencedObject.length == 1)) {
          listOfBuyLines[rules.BuyRules[i].referencedObject.lineId] = []
          if (rules.BuyRules[i].referencedObject.type == 'Cumulative SMA') {
            listOfBuyLines[rules.BuyRules[i].referencedObject.lineId].push({ length: rules.BuyRules[i].referencedObject.length, data: this.calculateCumulativeSMA() })
          }
          else if (rules.BuyRules[i].referencedObject.type == 'Cumulative VWAP') {
            listOfBuyLines[rules.BuyRules[i].referencedObject.lineId].push({ length: rules.BuyRules[i].referencedObject.length, data: this.calculateCumulativeVWAP() })
          }
        }
      }

      for (let i = 0; i < rules.SellRules.length; i++) {
        if (rules.SellRules[i].primaryObject.length > 1 && rules.SellRules[i].primaryObject.lengthLoopChecked) {
          if (listOfBuyLines[rules.SellRules[i].primaryObject.lineId] == undefined) {
            listOfBuyLines[rules.SellRules[i].primaryObject.lineId] = []
            let from = rules.SellRules[i].primaryObject.lengthLoopCheckFromAmnt
            let to = rules.SellRules[i].primaryObject.lengthLoopCheckToAmnt
            let step = rules.SellRules[i].primaryObject.lengthLoopCheckStepAmnt
            for (let j = from; j <= to; j += step) {
              if (rules.SellRules[i].primaryObject.type == 'EMA') {
                listOfBuyLines[rules.SellRules[i].primaryObject.lineId].push({ length: j, data: this.calculateEMA(j) })
              }
              else if (rules.SellRules[i].primaryObject.type == 'SMA') {
                listOfBuyLines[rules.SellRules[i].primaryObject.lineId].push({ length: j, data: this.calculateSMA(j) })
              }
              else if (rules.SellRules[i].primaryObject.type == 'Rolling VWAP') {
                listOfBuyLines[rules.SellRules[i].primaryObject.lineId].push({ length: j, data: this.calculateRollingVWAP(j) })
              }
            }
          }
        }
        else if ((listOfBuyLines[rules.SellRules[i].primaryObject.lineId] == undefined && rules.SellRules[i].primaryObject.length == 1)) {
          listOfBuyLines[rules.SellRules[i].primaryObject.lineId] = []
          if (rules.SellRules[i].primaryObject.type == 'Cumulative SMA') {
            listOfBuyLines[rules.SellRules[i].primaryObject.lineId].push({ length: rules.SellRules[i].primaryObject.length, data: this.calculateCumulativeSMA() })
          }
          else if (rules.SellRules[i].primaryObject.type == 'Cumulative VWAP') {
            listOfBuyLines[rules.SellRules[i].primaryObject.lineId].push({ length: rules.SellRules[i].primaryObject.length, data: this.calculateCumulativeVWAP() })
          }
        }
        if (rules.SellRules[i].referencedObject.length > 1 && rules.SellRules[i].referencedObject.lengthLoopChecked) {
          if (listOfBuyLines[rules.SellRules[i].referencedObject.lineId] == undefined) {
            listOfBuyLines[rules.SellRules[i].referencedObject.lineId] = []
            let from = rules.SellRules[i].referencedObject.lengthLoopCheckFromAmnt
            let to = rules.SellRules[i].referencedObject.lengthLoopCheckToAmnt
            let step = rules.SellRules[i].referencedObject.lengthLoopCheckStepAmnt
            for (let j = from; j <= to; j += step) {
              if (rules.SellRules[i].referencedObject.type == 'EMA') {
                listOfBuyLines[rules.SellRules[i].referencedObject.lineId].push({ length: j, data: this.calculateEMA(j) })
              }
              else if (rules.SellRules[i].referencedObject.type == 'SMA') {
                listOfBuyLines[rules.SellRules[i].referencedObject.lineId].push({ length: j, data: this.calculateSMA(j) })
              }
              else if (rules.SellRules[i].referencedObject.type == 'Rolling VWAP') {
                listOfBuyLines[rules.SellRules[i].referencedObject.lineId].push({ length: j, data: this.calculateRollingVWAP(j) })
              }
            }
          }
        }
        else if ((listOfBuyLines[rules.SellRules[i].referencedObject.lineId] == undefined && rules.SellRules[i].referencedObject.length == 1)) {
          listOfBuyLines[rules.SellRules[i].referencedObject.lineId] = []
          if (rules.SellRules[i].referencedObject.type == 'Cumulative SMA') {
            listOfBuyLines[rules.SellRules[i].referencedObject.lineId].push({ length: rules.SellRules[i].referencedObject.length, data: this.calculateCumulativeSMA() })
          }
          else if (rules.SellRules[i].referencedObject.type == 'Cumulative VWAP') {
            listOfBuyLines[rules.SellRules[i].referencedObject.lineId].push({ length: rules.SellRules[i].referencedObject.length, data: this.calculateCumulativeVWAP() })
          }
        }


      }
      const allCombinations = this.generateCombinations(listOfBuyLines);
      console.log(listOfBuyLines)
      let result = this.addRule2(listOfBuyLines, allCombinations, rules)
      /* finalResult.push(result)
      console.log(finalResult)
      let summedResults = []
      for (let i = 0; i < finalResult[0].length; i++) {
        let profit = 0
        let buyCombo = []
        let sellCombo = []
        let wins = 0
        let losses = 0
        for (let j = 0; j < finalResult.length; j++) {
          profit += finalResult[j][i].profit
          buyCombo = finalResult[j][i].buyCombos
          sellCombo = finalResult[j][i].sellCombos
          wins += finalResult[j][i].wins
          losses += finalResult[j][i].losses
        }
        summedResults.push({ profit: profit, buyCombo: buyCombo, sellCombo: sellCombo, wins: wins, losses: losses })
      }
      summedResults.sort((a, b) => b.profit - a.profit) */
      result.sort((a, b) => b.profit - a.profit)
      console.log(result)
    }

    this.isLoading = false;

  }

  generateCombinations(data: any, keys: number[] = []): number[][] {
    const dataKeys = Object.keys(data).map(k => parseInt(k));

    if (keys.length === dataKeys.length) {
      // Base case: we've selected an index for each key
      return [keys];
    }

    const currentKeyIndex = keys.length;
    const currentKey = dataKeys[currentKeyIndex];
    const combinations: number[][] = [];

    // For each possible index in the current key's array
    for (let i = 0; i < data[currentKey].length; i++) {
      const newKeys = [...keys, i];
      combinations.push(...this.generateCombinations(data, newKeys));
    }

    return combinations;
  }
  generateNonLineCombinations(data: any, keys: any[] = []): any[][] {
    const dataKeys = Object.keys(data).map(k => k);

    if (keys.length === dataKeys.length) {
      // Base case: we've selected an index for each key
      return [keys];
    }

    const currentKeyIndex = keys.length;
    const currentKey = dataKeys[currentKeyIndex];
    const combinations: any[][] = [];

    // For each possible index in the current key's array
    for (let i = 0; i < data[currentKey].length; i++) {
      const newKeys = [...keys, { name: currentKey, value: data[currentKey][i].value }];
      combinations.push(...this.generateNonLineCombinations(data, newKeys));
    }

    return combinations;
  }
  overallCount = 0
  addRule2(buyLines: { [key: number]: { length: number, data: LineData[] }[] }, combinations: number[][], rules: RuleDto) {

    let returnData = []
    let count = 0
    for (let i = 0; i < combinations.length; i++) {
      let counter = 0
      for (let j = 0; j < combinations[i].length; j++) {
        if (buyLines[j][combinations[i][j]].length > counter) {
          counter = buyLines[j][combinations[i][j]].length
        }
      }
      counter = counter - 1



      let nonBuyLineCombinations: { [key: string]: { value: number }[] } = {}
      for (let n = 0; n < rules.BuyRules.length; n++) {
        if (rules.BuyRules[n].buyTimeChecked) {
          nonBuyLineCombinations[rules.BuyRules[n].buyTimeUId] = []
          let from = rules.BuyRules[n].buyTimeCheckFromAmnt
          let to = rules.BuyRules[n].buyTimeCheckToAmnt
          let step = rules.BuyRules[n].buyTimeCheckStepAmnt
          for (let k = from; k <= to; k += step) {
            nonBuyLineCombinations[rules.BuyRules[n].buyTimeUId].push({ value: k })
          }
        }
        if (rules.BuyRules[n].desiredAction.amountLoopChecked) {
          nonBuyLineCombinations[rules.BuyRules[n].desiredAction.amountLoopUId] = []
          let from = rules.BuyRules[n].desiredAction.amountLoopCheckFromAmnt
          let to = rules.BuyRules[n].desiredAction.amountLoopCheckToAmnt
          let step = rules.BuyRules[n].desiredAction.amountLoopCheckStepAmnt
          for (let k = from; k <= to; k += step) {
            nonBuyLineCombinations[rules.BuyRules[n].desiredAction.amountLoopUId].push({ value: k })
          }
        }
        if (rules.BuyRules[n].desiredAction.lengthLoopChecked) {
          nonBuyLineCombinations[rules.BuyRules[n].desiredAction.lengthLoopUId] = []
          let from = rules.BuyRules[n].desiredAction.lengthLoopCheckFromAmnt
          let to = rules.BuyRules[n].desiredAction.lengthLoopCheckToAmnt
          let step = rules.BuyRules[n].desiredAction.lengthLoopCheckStepAmnt
          for (let k = from; k <= to; k += step) {
            nonBuyLineCombinations[rules.BuyRules[n].desiredAction.lengthLoopUId].push({ value: k })
          }
        }
        if (buyLines[rules.BuyRules[n].primaryObject.lineId] != undefined) {
          const keys = Object.keys(buyLines);
          let index = keys.indexOf(rules.BuyRules[n].primaryObject.lineId.toString());
          let comboIndex = combinations[i][index]
          rules.BuyRules[n].primaryObject.data = buyLines[rules.BuyRules[n].primaryObject.lineId][comboIndex].data
          rules.BuyRules[n].primaryObject.length = buyLines[rules.BuyRules[n].primaryObject.lineId][comboIndex].length
        }
        if (buyLines[rules.BuyRules[n].referencedObject.lineId] != undefined) {
          const keys = Object.keys(buyLines);
          let index = keys.indexOf(rules.BuyRules[n].referencedObject.lineId.toString());
          let comboIndex = combinations[i][index]
          rules.BuyRules[n].referencedObject.data = buyLines[rules.BuyRules[n].referencedObject.lineId][comboIndex].data
          rules.BuyRules[n].referencedObject.length = buyLines[rules.BuyRules[n].referencedObject.lineId][comboIndex].length
        }
      }
      let nonSellLineCombinations: { [key: string]: { value: number }[] } = {}
      for (let s = 0; s < rules.SellRules.length; s++) {
        if (rules.SellRules[s].desiredAction.amountLoopChecked) {
          nonSellLineCombinations[rules.SellRules[s].desiredAction.amountLoopUId] = []
          let from = rules.SellRules[s].desiredAction.amountLoopCheckFromAmnt
          let to = rules.SellRules[s].desiredAction.amountLoopCheckToAmnt
          let step = rules.SellRules[s].desiredAction.amountLoopCheckStepAmnt
          for (let k = from; k <= to; k += step) {
            nonSellLineCombinations[rules.SellRules[s].desiredAction.amountLoopUId].push({ value: k })
          }
        }
        if (rules.SellRules[s].desiredAction.lengthLoopChecked) {
          nonSellLineCombinations[rules.SellRules[s].desiredAction.lengthLoopUId] = []
          let from = rules.SellRules[s].desiredAction.lengthLoopCheckFromAmnt
          let to = rules.SellRules[s].desiredAction.lengthLoopCheckToAmnt
          let step = rules.SellRules[s].desiredAction.lengthLoopCheckStepAmnt
          for (let k = from; k <= to; k += step) {
            nonSellLineCombinations[rules.SellRules[s].desiredAction.lengthLoopUId].push({ value: k })
          }
        }
        if (buyLines[rules.SellRules[s].primaryObject.lineId] != undefined) {
          const keys = Object.keys(buyLines);
          let index = keys.indexOf(rules.SellRules[s].primaryObject.lineId.toString());
          let comboIndex = combinations[i][index]
          rules.SellRules[s].primaryObject.data = buyLines[rules.SellRules[s].primaryObject.lineId][comboIndex].data
          rules.SellRules[s].primaryObject.length = buyLines[rules.SellRules[s].primaryObject.lineId][comboIndex].length
        }
        if (buyLines[rules.SellRules[s].referencedObject.lineId] != undefined) {
          const keys = Object.keys(buyLines);
          let index = keys.indexOf(rules.SellRules[s].referencedObject.lineId.toString());
          let comboIndex = combinations[i][index]
          rules.SellRules[s].referencedObject.data = buyLines[rules.SellRules[s].referencedObject.lineId][comboIndex].data
          rules.SellRules[s].referencedObject.length = buyLines[rules.SellRules[s].referencedObject.lineId][comboIndex].length
        }
      }
      let buyCombinations = this.generateNonLineCombinations(nonBuyLineCombinations)
      let sellCombinations = this.generateNonLineCombinations(nonSellLineCombinations)
      console.time('final loop')
      for (let k = 0; k < buyCombinations.length; k++) {
        let buyCombo: any[] = []
        for (let n = 0; n < rules.BuyRules.length; n++) {
          for (let p = 0; p < buyCombinations[k].length; p++) {
            if (buyCombinations[k][p].name == n + 'A') {
              rules.BuyRules[n].buyTime = buyCombinations[k][p].value
            }
            else if (buyCombinations[k][p].name == n + 'B') {
              rules.BuyRules[n].desiredAction.amount = buyCombinations[k][p].value
            }
            else if (buyCombinations[k][p].name == n + 'C') {
              rules.BuyRules[n].desiredAction.length = buyCombinations[k][p].value
            }
          }
          buyCombo.push({
            primaryLength: rules.BuyRules[n].primaryObject.length,
            time: rules.BuyRules[n].buyTime,
            actionAmnt: rules.BuyRules[n].desiredAction.amount,
            actionLength: rules.BuyRules[n].desiredAction.length,
            referencedLength: rules.BuyRules[n].referencedObject.length
          })
        }

        for (let n = 0; n < sellCombinations.length; n++) {
          count++
          let sellCombo: any[] = []
          for (let s = 0; s < rules.SellRules.length; s++) {
            for (let p = 0; p < sellCombinations[n].length; p++) {
              if (sellCombinations[n][p].name == s + 'A') {
                rules.SellRules[s].desiredAction.amount = sellCombinations[n][p].value
              }
              else if (sellCombinations[n][p].name == s + 'B') {
                rules.SellRules[s].desiredAction.length = sellCombinations[n][p].value
              }
            }
            sellCombo.push({
              primaryLength: rules.SellRules[s].primaryObject.length,
              actionAmnt: rules.SellRules[s].desiredAction.amount,
              actionLength: rules.SellRules[s].desiredAction.length,
              referencedLength: rules.SellRules[s].referencedObject.length
            })
          }

          let buySell = 'Buy'
          let lastOrderPrice: number = 0
          let profit = 0
          let numberOfConsecutiveLosses = 0
          let timeOutPeriod = 0
          let wins = 0
          let losses = 0



          const operators = this.operators
          const buyRules = rules.BuyRules
          const sellRules = rules.SellRules
          const maxLosses = rules.NumberOfLossesInARowToStop
          const timeoutMs = rules.TimeOutAfterStopLossSell * 60000


          if (this.intraDayChecked) {
            const stockData = this.stockDataForSelectedDay
            for (let m = counter; m < stockData.length; m++) {
              if (buySell === 'Buy') {
                if (stockData[m].time < timeOutPeriod || numberOfConsecutiveLosses >= maxLosses) {
                  continue
                }
                let canBuy = true
                for (let j = 0; j < buyRules.length; j++) {
                  if (!operators[buyRules[j].desiredAction.type](buyRules[j], m)) {
                    canBuy = false
                    break
                  }
                }
                if (canBuy) {
                  lastOrderPrice = stockData[m].stockPrice
                  buySell = 'Sell'
                  for (let j = 0; j < sellRules.length; j++) {
                    if (sellRules[j].desiredAction.type == 'Trailing Stop') {
                      sellRules[j].desiredAction.current = 0
                      sellRules[j].tradeHigh = stockData[m].stockPrice
                    }
                  }
                }
              }
              else {
                const currentPrice = stockData[m].stockPrice
                let orGroupIndex = 0
                let orGroups = [true]
                for (let j = 0; j < sellRules.length; j++) {
                  const sellRule = sellRules[j]
                  if (sellRule.desiredAction.type === 'Trailing Stop' && currentPrice > sellRule.tradeHigh) {
                    sellRule.tradeHigh = currentPrice
                    if (sellRule.tradeHigh >= (lastOrderPrice + sellRule.desiredAction.amount)) {
                      sellRule.desiredAction.current = sellRule.tradeHigh - sellRule.desiredAction.amount
                    }
                  }
                  if (sellRule.andOr == 'Or') {
                    orGroupIndex++
                    orGroups[orGroupIndex] = true
                  }
                  if (!operators[sellRule.desiredAction.type](sellRule, m, lastOrderPrice)) {
                    orGroups[orGroupIndex] = false
                  }


                }

                const shouldSell = m === stockData.length - 1 || orGroups.some(group => group)

                if (shouldSell) {
                  const tradeProfit = currentPrice - lastOrderPrice
                  profit += tradeProfit
                  if (tradeProfit > 0) {
                    wins++
                  }
                  else {
                    losses++
                    numberOfConsecutiveLosses++
                    timeOutPeriod = timeoutMs + stockData[m].time
                  }

                  buySell = 'Buy'
                }



              }
            }

          }
          else {
            const stockData = this.selectedInterDayStockData
            for (let m = counter; m < stockData.length; m++) {
              if (buySell === 'Buy') {
                if (stockData[m].date < timeOutPeriod || numberOfConsecutiveLosses >= maxLosses) {
                  continue
                }
                let canBuy = true
                for (let j = 0; j < buyRules.length; j++) {
                  if (!operators[buyRules[j].desiredAction.type](buyRules[j], m)) {
                    canBuy = false
                    break
                  }
                }
                if (canBuy) {
                  lastOrderPrice = stockData[m].close
                  buySell = 'Sell'
                  for (let j = 0; j < sellRules.length; j++) {
                    if (sellRules[j].desiredAction.type == 'Trailing Stop') {
                      sellRules[j].desiredAction.current = 0
                      sellRules[j].tradeHigh = stockData[m].close
                    }
                  }
                }
              }
              else {
                const currentPrice = stockData[m].close
                let orGroupIndex = 0
                let orGroups = [true]
                for (let j = 0; j < sellRules.length; j++) {
                  const sellRule = sellRules[j]
                  if (sellRule.desiredAction.type === 'Trailing Stop' && currentPrice > sellRule.tradeHigh) {
                    sellRule.tradeHigh = currentPrice
                    if (sellRule.tradeHigh >= (lastOrderPrice + sellRule.desiredAction.amount)) {
                      sellRule.desiredAction.current = sellRule.tradeHigh - sellRule.desiredAction.amount
                    }
                  }
                  if (sellRule.andOr == 'Or') {
                    orGroupIndex++
                    orGroups[orGroupIndex] = true
                  }
                  if (!operators[sellRule.desiredAction.type](sellRule, m, lastOrderPrice)) {
                    orGroups[orGroupIndex] = false
                  }


                }

                const shouldSell = m === stockData.length - 1 || orGroups.some(group => group)

                if (shouldSell) {
                  const tradeProfit = currentPrice - lastOrderPrice
                  profit += tradeProfit
                  if (tradeProfit > 0) {
                    wins++
                  }
                  else {
                    losses++
                    numberOfConsecutiveLosses++
                    timeOutPeriod = timeoutMs + stockData[m].date
                  }

                  buySell = 'Buy'
                }



              }
            }
          }

          returnData.push({ wins: wins, losses: losses, profit: profit, buyCombos: buyCombo, sellCombos: sellCombo })
        }

      }
      console.timeEnd('final loop')



    }
    return returnData

  }
  /* Intra Day */
  async onSelectedDateChange(event: MatDatepickerInputEvent<Date>) {
    this.selectedDate = new Date(event.value!).toISOString().split('T')[0]
    console.log(this.selectedDate)
    if (this.selectedStockName != '') {
      this.isLoading = true;
      let exchange = this.distinctStocks.filter(e => e.name == this.selectedStockName)[0].exchange
      this.stockDataForSelectedDay = await PolygonController.getIntraDayDataCall(this.selectedStockName, this.selectedDate, exchange)
      console.log(this.stockDataForSelectedDay)
      this.updateChartIntraDay()
      this.addNewLinesToGraph(this.listOfAddedLines)
      this.refreshRules()
      this.isLoading = false;
    }
    /*  if (event.isUserInput == true) {
       this.isLoading = true
       this.selectedDate = event.source.value
       await this.updateStockChartData(this.selectedDate)
       //this.calculateIntraDaySma()
       this.updateChartIntraDay()
       //this.updateVolumeChartIntraDay()
       this.addNewLinesToGraph(this.listOfAddedLines)
       this.refreshRules()
       this.onRunSimulation()
 
       //this.runSimulationIntraDay()
       //this.topAlgos = []
       this.isLoading = false
     } */
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








  clearGraphBuyAndSellPoints() {
    this.stockChart.options.plugins.annotation.annotations = []
    this.stockChart.update()
  }
  updateGraphBuyAndSellPointsIntraDayNew(orderLocations: orderLocation[]) {
    console.log(orderLocations)
    this.annotationsArray = []
    if (this.intraDayChecked) {
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
    }
    else {
      for (let i = 0; i < orderLocations.length; i++) {
        this.annotationsArray.push({
          type: 'line',
          //display: this.selectedStockHistoryData.length > 0,

          xMin: this.selectedInterDayStockData.findIndex(x => x.date == orderLocations[i].date),
          xMax: this.selectedInterDayStockData.findIndex(x => x.date == orderLocations[i].date),
          borderColor: '#7874ff',
          borderWidth: 2,
          label: {
            display: true,
            content: orderLocations[i].buySell + ': ' + orderLocations[i].price,
            position: 'end'
          }
        })
      }
    }

    this.stockChart.options.plugins.annotation.annotations = this.annotationsArray
    this.stockChart.update()
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

  selectedStockBasicHistoryData: DbStockBasicHistory[] = []
  async getStockBasicHistoryData() {
    this.selectedStockBasicHistoryData = await dbStockBasicHistoryRepo.find({ where: { stockName: this.selectedStockName }, orderBy: { date: 'asc' } })

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
    console.log(this.listOfAddedLines)
    this.stockChart.data.datasets = [this.stockChart.data.datasets[0]]
    let newListOfAddedLines = structuredClone(this.listOfAddedLines)
    this.listOfAddedLines.length = 0
    //newListOfAddedLines = newListOfAddedLines.filter(e => e.lineType != 'Price' && e.id != -10 && e.id != -11 && e.id != -12)

    for (let i = 0; i < newListOfAddedLines.length; i++) {
      let lineData: LineData[] = []
      if (newListOfAddedLines[i].lineType == 'SMA') {
        newListOfAddedLines[i].data = this.calculateSMA(newListOfAddedLines[i].lineLength)
      }
      else if (newListOfAddedLines[i].lineType == 'EMA') {
        newListOfAddedLines[i].data = this.calculateEMA(newListOfAddedLines[i].lineLength)
      }
      else if (newListOfAddedLines[i].lineType == 'Cumulative VWAP') {
        newListOfAddedLines[i].data = this.calculateCumulativeVWAP();
      }
      else if (newListOfAddedLines[i].lineType == 'Rolling VWAP') {
        newListOfAddedLines[i].data = this.calculateRollingVWAP(newListOfAddedLines[i].lineLength);
      }
      else if (newListOfAddedLines[i].lineType == 'Cumulative SMA') {
        newListOfAddedLines[i].data = this.calculateCumulativeSMA()
      }
      else if (newListOfAddedLines[i].lineType == 'Cumulative EMA') {
        newListOfAddedLines[i].data = this.calculateCumulativeEMA()
      }
      if (newListOfAddedLines[i].lineType == 'Bollinger Bands') {
        let bollingerData: LineData[][] = this.calculateBollingerBands(newListOfAddedLines[i].lineLength, newListOfAddedLines[i].channelFactor)
        //let filteredLine = this.listOfAddedLines.filter(e => e.id == linesNew[i].id)[0]
        //filteredLine.data = lineData
        this.listOfAddedLines.push({
          id: -10,
          lineType: 'Bollinger Band EMA',
          lineLength: newListOfAddedLines[i].lineLength,
          data: bollingerData[0],
          channelFactor: newListOfAddedLines[i].channelFactor
        })
        this.listOfAddedLines.push({
          id: -11,
          lineType: 'Bollinger Band Upper',
          lineLength: newListOfAddedLines[i].lineLength,
          data: bollingerData[1],
          channelFactor: newListOfAddedLines[i].channelFactor
        })
        this.listOfAddedLines.push({
          id: -12,
          lineType: 'Bollinger Band Lower',
          lineLength: newListOfAddedLines[i].lineLength,
          data: bollingerData[2],
          channelFactor: newListOfAddedLines[i].channelFactor
        })
        this.stockChart.data.datasets.push({
          label: newListOfAddedLines[i].lineType + ' - ' + newListOfAddedLines[i].lineLength + ' EMA',
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
          label: newListOfAddedLines[i].lineType + ' - ' + newListOfAddedLines[i].lineLength + ' Upper',
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
          label: newListOfAddedLines[i].lineType + ' - ' + newListOfAddedLines[i].lineLength + ' Lower',
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
      else if (newListOfAddedLines[i].lineType == 'Keltner Channels') {
        let keltnerData: LineData[][] = this.calculateKeltnerChannel(newListOfAddedLines[i].lineLength, newListOfAddedLines[i].channelFactor)
        //let filteredLine = this.listOfAddedLines.filter(e => e.id == linesNew[i].id)[0]
        //filteredLine.data = lineData
        this.listOfAddedLines.push({
          id: -10,
          lineType: 'Keltner Channel EMA',
          lineLength: newListOfAddedLines[i].lineLength,
          data: keltnerData[0],
          channelFactor: newListOfAddedLines[i].channelFactor
        })
        this.listOfAddedLines.push({
          id: -11,
          lineType: 'Keltner Channel Upper',
          lineLength: newListOfAddedLines[i].lineLength,
          data: keltnerData[1],
          channelFactor: newListOfAddedLines[i].channelFactor
        })
        this.listOfAddedLines.push({
          id: -12,
          lineType: 'Keltner Channel Lower',
          lineLength: newListOfAddedLines[i].lineLength,
          data: keltnerData[2],
          channelFactor: newListOfAddedLines[i].channelFactor
        })
        this.stockChart.data.datasets.push({
          label: newListOfAddedLines[i].lineType + ' - ' + newListOfAddedLines[i].lineLength + ' EMA',
          data: keltnerData[0].map(e => e.value),
          backgroundColor: this.listOfBGCOlors[i],
          hoverBackgroundColor: this.listOfBGCOlors[i],
          borderColor: this.listOfBGCOlors[i],
          pointBackgroundColor: this.listOfBGCOlors[i],
          pointBorderColor: this.listOfBGCOlors[i],
          pointRadius: 0,
          spanGaps: true
        })
        this.stockChart.data.datasets.push({
          label: newListOfAddedLines[i].lineType + ' - ' + newListOfAddedLines[i].lineLength + ' Upper',
          data: keltnerData[1].map(e => e.value),
          backgroundColor: this.listOfBGCOlors[i],
          hoverBackgroundColor: this.listOfBGCOlors[i],
          borderColor: this.listOfBGCOlors[i],
          pointBackgroundColor: this.listOfBGCOlors[i],
          pointBorderColor: this.listOfBGCOlors[i],
          pointRadius: 0,
          spanGaps: true
        })
        this.stockChart.data.datasets.push({
          label: newListOfAddedLines[i].lineType + ' - ' + newListOfAddedLines[i].lineLength + ' Lower',
          data: keltnerData[2].map(e => e.value),
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
          label: newListOfAddedLines[i].lineType + ' - ' + newListOfAddedLines[i].lineLength,
          data: newListOfAddedLines[i].data.map(e => e.value),
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
    this.listOfAddedLines = this.listOfAddedLines.concat(newListOfAddedLines)

    this.stockChart.update();
  }
  addNewLinesToGraphNew() {
    this.stockChart.data.datasets = [this.stockChart.data.datasets[0]]
    let newListOfAddedLines = structuredClone(this.listOfAddedLines)
    newListOfAddedLines = newListOfAddedLines.filter(e => e.lineType != 'Price' && e.id != -10 && e.id != -11 && e.id != -12)

    let rules = structuredClone(this.listOfAddedRules)
    for (let i = 0; i < newListOfAddedLines.length; i++) {
      if (newListOfAddedLines[i].lineType == 'SMA') {
        newListOfAddedLines[i].data = this.calculateSMA(newListOfAddedLines[i].lineLength)
      }
      else if (newListOfAddedLines[i].lineType == 'EMA') {
        newListOfAddedLines[i].data = this.calculateEMA(newListOfAddedLines[i].lineLength)
      }
      else if (newListOfAddedLines[i].lineType == 'Cumulative VWAP') {
        newListOfAddedLines[i].data = this.calculateCumulativeVWAP();
      }
      else if (newListOfAddedLines[i].lineType == 'Rolling VWAP') {
        newListOfAddedLines[i].data = this.calculateRollingVWAP(newListOfAddedLines[i].lineLength);
      }
      else if (newListOfAddedLines[i].lineType == 'Cumulative SMA') {
        newListOfAddedLines[i].data = this.calculateCumulativeSMA()
      }
      else if (newListOfAddedLines[i].lineType == 'Cumulative EMA') {
        newListOfAddedLines[i].data = this.calculateCumulativeEMA()
      }
      this.listOfAddedLines = newListOfAddedLines


      for (let i = 0; i < rules.BuyRules.length; i++) {
        if (rules.BuyRules[i].primaryObject.type != "") {
          let filteredLine = this.listOfAddedLines.filter(e => e.lineType == rules.BuyRules[i].primaryObject.type && e.lineLength == rules.BuyRules[i].primaryObject.length)[0]
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
    }
    this.listOfAddedRules = rules
  }

  calculateSMA(lineLength: number): LineData[] {
    let returnData: LineData[] = []
    let windowSum = 0

    if (this.intraDayChecked) {
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
    }
    else {
      for (let i = 0; i < lineLength - 1; i++) {
        returnData.push({ value: null, time: this.selectedInterDayStockData[i].date })
        windowSum += this.selectedInterDayStockData[i].close
      }
      windowSum += this.selectedInterDayStockData[lineLength - 1].close
      returnData.push({ value: windowSum / lineLength, time: this.selectedInterDayStockData[lineLength - 1].date })
      for (let j = lineLength; j < this.selectedInterDayStockData.length; j++) {
        windowSum += this.selectedInterDayStockData[j].close - this.selectedInterDayStockData[j - lineLength].close
        returnData.push({ value: windowSum / lineLength, time: this.selectedInterDayStockData[j].date })
      }
    }
    console.log(returnData)

    return returnData



  }
  calculateEMA(lineLength: number): LineData[] {
    let returnData: LineData[] = []
    let windowSum = 0
    if (this.intraDayChecked) {
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
    }
    else {
      for (let i = 0; i < lineLength - 1; i++) {
        returnData.push({ value: null, time: this.selectedInterDayStockData[i].date })
        windowSum += this.selectedInterDayStockData[i].close
      }
      windowSum += this.selectedInterDayStockData[lineLength - 1].close
      returnData.push({ value: windowSum / lineLength, time: this.selectedInterDayStockData[lineLength - 1].date })

      let multiplyFactor = 2 / (lineLength + 1)
      for (let i = lineLength; i < this.selectedInterDayStockData.length; i++) {
        let newVal = (this.selectedInterDayStockData[i].close * multiplyFactor) + (returnData[returnData.length - 1].value! * (1 - multiplyFactor))
        returnData.push({ value: newVal, time: this.selectedInterDayStockData[i].date })
      }
    }

    return returnData
  }
  calculateCumulativeVWAP(): LineData[] {
    let returnData: LineData[] = []
    let cumulativePV = 0;
    let cumulativeVolume = 0;
    if (this.intraDayChecked) {
      for (let i = 0; i < this.stockDataForSelectedDay.length; i++) {
        cumulativePV += this.stockDataForSelectedDay[i].stockPrice * this.stockDataForSelectedDay[i].volume;
        cumulativeVolume += this.stockDataForSelectedDay[i].volume;
        const vwap = cumulativePV / cumulativeVolume;
        returnData.push({ value: vwap, time: this.stockDataForSelectedDay[i].time });
      }
    }
    else {
      for (let i = 0; i < this.selectedInterDayStockData.length; i++) {
        cumulativePV += this.selectedInterDayStockData[i].close * this.selectedInterDayStockData[i].volume;
        cumulativeVolume += this.selectedInterDayStockData[i].volume;
        const vwap = cumulativePV / cumulativeVolume;
        returnData.push({ value: vwap, time: this.selectedInterDayStockData[i].date });
      }
    }


    return returnData
  }
  calculateRollingVWAP(lineLength: number): LineData[] {
    let returnData: LineData[] = []
    let cumulativePV = 0;
    let cumulativeVolume = 0;
    if (this.intraDayChecked) {
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
    }
    else {
      for (let i = 0; i < lineLength - 1; i++) {
        cumulativePV += this.selectedInterDayStockData[i].close * this.selectedInterDayStockData[i].volume
        cumulativeVolume += this.selectedInterDayStockData[i].volume
        returnData.push({ value: null, time: this.selectedInterDayStockData[i].date })
      }
      cumulativePV += this.selectedInterDayStockData[lineLength - 1].close * this.selectedInterDayStockData[lineLength - 1].volume
      cumulativeVolume += this.selectedInterDayStockData[lineLength - 1].volume
      returnData.push({ value: cumulativePV / cumulativeVolume, time: this.selectedInterDayStockData[lineLength - 1].date });
      for (let i = lineLength; i < this.selectedInterDayStockData.length; i++) {
        cumulativePV += (this.selectedInterDayStockData[i].close * this.selectedInterDayStockData[i].volume) - (this.selectedInterDayStockData[i - lineLength].close * this.selectedInterDayStockData[i - lineLength].volume);
        cumulativeVolume += this.selectedInterDayStockData[i].volume - this.selectedInterDayStockData[i - lineLength].volume;
        const vwap = cumulativePV / cumulativeVolume;
        returnData.push({ value: vwap, time: this.selectedInterDayStockData[i].date });
      }
    }


    return returnData
  }

  calculateBollingerBands(lineLength: number, channelFactor: number): LineData[][] {
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
    if (this.intraDayChecked) {
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
      returnData[1].push({ value: (windowSum / lineLength) + (channelFactor * standardDeviation), time: this.stockDataForSelectedDay[lineLength - 1].time })
      returnData[2].push({ value: (windowSum / lineLength) - (channelFactor * standardDeviation), time: this.stockDataForSelectedDay[lineLength - 1].time })

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
        returnData[1].push({ value: newVal + (channelFactor * standardDeviation), time: this.stockDataForSelectedDay[i].time })
        returnData[2].push({ value: newVal - (channelFactor * standardDeviation), time: this.stockDataForSelectedDay[i].time })

      }
    }
    else {
      for (let i = 0; i < lineLength - 1; i++) {
        window.push(this.selectedInterDayStockData[i].close)
        returnData[0].push({ value: null, time: this.selectedInterDayStockData[i].date })
        returnData[1].push({ value: null, time: this.selectedInterDayStockData[i].date })
        returnData[2].push({ value: null, time: this.selectedInterDayStockData[i].date })
        windowSum += this.selectedInterDayStockData[i].close
      }
      windowSum += this.selectedInterDayStockData[lineLength - 1].close
      window.push(this.selectedInterDayStockData[lineLength - 1].close)
      mean = windowSum / lineLength
      for (let i = 0; i < window.length; i++) {
        listOfDeviations.push((window[i] - mean) * (window[i] - mean))
      }
      averageOfSqDev = listOfDeviations.reduce((sum, val) => sum + val, 0) / listOfDeviations.length
      standardDeviation = Math.sqrt(averageOfSqDev)

      returnData[0].push({ value: windowSum / lineLength, time: this.selectedInterDayStockData[lineLength - 1].date })
      returnData[1].push({ value: (windowSum / lineLength) + (channelFactor * standardDeviation), time: this.selectedInterDayStockData[lineLength - 1].date })
      returnData[2].push({ value: (windowSum / lineLength) - (channelFactor * standardDeviation), time: this.selectedInterDayStockData[lineLength - 1].date })

      let multiplyFactor = 2 / (lineLength + 1)
      for (let i = lineLength; i < this.selectedInterDayStockData.length; i++) {
        listOfDeviations.length = 0
        window.shift()
        window.push(this.selectedInterDayStockData[i].close)
        let newVal = (this.selectedInterDayStockData[i].close * multiplyFactor) + (returnData[0][returnData[0].length - 1].value! * (1 - multiplyFactor))
        returnData[0].push({ value: newVal, time: this.selectedInterDayStockData[i].date })
        let sumOfWindow = window.reduce((sum, val) => sum + val, 0)
        mean = sumOfWindow / lineLength
        for (let j = 0; j < window.length; j++) {
          listOfDeviations.push((window[j] - mean) * (window[j] - mean))
        }
        averageOfSqDev = listOfDeviations.reduce((sum, val) => sum + val, 0) / listOfDeviations.length
        standardDeviation = Math.sqrt(averageOfSqDev)
        returnData[1].push({ value: newVal + (channelFactor * standardDeviation), time: this.selectedInterDayStockData[i].date })
        returnData[2].push({ value: newVal - (channelFactor * standardDeviation), time: this.selectedInterDayStockData[i].date })

      }
    }

    return returnData
  }
  calculateCumulativeSMA(): LineData[] {
    let returnData: LineData[] = []
    let cumulativePrice: number = 0
    if (this.intraDayChecked) {
      for (let i = 0; i < this.stockDataForSelectedDay.length; i++) {
        cumulativePrice += this.stockDataForSelectedDay[i].stockPrice
        const sma = cumulativePrice / (i + 1);
        returnData.push({ value: sma, time: this.stockDataForSelectedDay[i].time });
      }
    }
    else {
      for (let i = 0; i < this.selectedInterDayStockData.length; i++) {
        cumulativePrice += this.selectedInterDayStockData[i].close
        const sma = cumulativePrice / (i + 1);
        returnData.push({ value: sma, time: this.selectedInterDayStockData[i].date });
      }
    }


    return returnData
  }
  calculateCumulativeEMA(): LineData[] {
    let returnData: LineData[] = []
    if (this.intraDayChecked) {
      returnData.push({ value: this.stockDataForSelectedDay[0].stockPrice, time: this.stockDataForSelectedDay[0].time })

      for (let i = 1; i < this.stockDataForSelectedDay.length; i++) {
        let multiplyFactor = 2 / (i + 1)
        let newVal = (this.stockDataForSelectedDay[i].stockPrice * multiplyFactor) + (returnData[returnData.length - 1].value! * (1 - multiplyFactor))
        returnData.push({ value: newVal, time: this.stockDataForSelectedDay[i].time })
      }
    }
    else {
      returnData.push({ value: this.selectedInterDayStockData[0].close, time: this.selectedInterDayStockData[0].date })

      for (let i = 1; i < this.selectedInterDayStockData.length; i++) {
        let multiplyFactor = 2 / (i + 1)
        let newVal = (this.selectedInterDayStockData[i].close * multiplyFactor) + (returnData[returnData.length - 1].value! * (1 - multiplyFactor))
        returnData.push({ value: newVal, time: this.selectedInterDayStockData[i].date })
      }
    }


    return returnData
  }

  addRuleDialogRef: any
  listOfAddedRules: RuleDto = {
    BuyRules: [],
    SellRules: [],
    NumberOfLossesInARowToStop: 0,
    TimeOutAfterStopLossSell: 0,
    StartDate: ''
  }
  calculateKeltnerChannel(lineLength: number, channelFactor: number): LineData[][] {
    let returnData: LineData[][] = []
    let averageData: LineData[] = []
    returnData.push(averageData)
    let upperData: LineData[] = []
    returnData.push(upperData)
    let lowerData: LineData[] = []
    returnData.push(lowerData)
    let windowSum = 0
    let tr = 0
    let atr = 0
    for (let i = 0; i < lineLength - 1; i++) {
      returnData[0].push({ value: null, time: this.stockDataForSelectedDay[i].time })
      returnData[1].push({ value: null, time: this.stockDataForSelectedDay[i].time })
      returnData[2].push({ value: null, time: this.stockDataForSelectedDay[i].time })
      if (i > 0) {
        tr += Math.abs(this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - 1].stockPrice)
      }
      windowSum += this.stockDataForSelectedDay[i].stockPrice
    }
    tr += Math.abs(this.stockDataForSelectedDay[lineLength - 1].stockPrice - this.stockDataForSelectedDay[lineLength - 2].stockPrice)
    windowSum += this.stockDataForSelectedDay[lineLength - 1].stockPrice
    atr = tr / lineLength
    returnData[0].push({ value: windowSum / lineLength, time: this.stockDataForSelectedDay[lineLength - 1].time })
    returnData[1].push({ value: (windowSum / lineLength) + (channelFactor * (tr / lineLength)), time: this.stockDataForSelectedDay[lineLength - 1].time })
    returnData[2].push({ value: (windowSum / lineLength) - (channelFactor * (tr / lineLength)), time: this.stockDataForSelectedDay[lineLength - 1].time })

    let multiplyFactor = 2 / (lineLength + 1)
    for (let i = lineLength; i < this.stockDataForSelectedDay.length; i++) {
      let newVal = (this.stockDataForSelectedDay[i].stockPrice * multiplyFactor) + (returnData[0][returnData[0].length - 1].value! * (1 - multiplyFactor))
      let newAtr = (Math.abs(this.stockDataForSelectedDay[i].stockPrice - this.stockDataForSelectedDay[i - 1].stockPrice) * multiplyFactor) + (atr * (1 - multiplyFactor))
      atr = newAtr
      returnData[0].push({ value: newVal, time: this.stockDataForSelectedDay[i].time })
      returnData[1].push({ value: newVal + (channelFactor * newAtr), time: this.stockDataForSelectedDay[i].time })
      returnData[2].push({ value: newVal - (channelFactor * newAtr), time: this.stockDataForSelectedDay[i].time })

    }


    return returnData
  }
  addRuleToGraph() {
    this.addRuleDialogRef = this.dialog.open(this.addRuleTemplate, {
      width: '1200px',
      enterAnimationDuration: 0,
      exitAnimationDuration: 0
    });
    this.addRuleDialogRef.afterClosed().subscribe(async (result: any) => {
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
      maxWidth: '1200px',
      enterAnimationDuration: 0,
      exitAnimationDuration: 0
    });
    this.algoLoopDialogRef.afterClosed().subscribe(async (result: any) => {
      this.runAlgoAllDaysWithLoop()
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
    "Take Profit": (rule, index, buyPrice) => this.intraDayChecked ? (this.stockDataForSelectedDay[index].stockPrice <= (buyPrice! * (1 - rule.desiredAction.amount))) : (this.selectedInterDayStockData[index].close <= (buyPrice! * (1 - rule.desiredAction.amount))),
    "Stop Loss": (rule, index, buyPrice) => this.intraDayChecked ? (this.stockDataForSelectedDay[index].stockPrice <= (buyPrice! * (1 - rule.desiredAction.amount))) : (this.selectedInterDayStockData[index].close <= (buyPrice! * (1 - rule.desiredAction.amount))),
    "After": (rule, index) => ('buyTime' in rule ? (this.stockDataForSelectedDay[index].time > (this.stockDataForSelectedDay[0].time + (rule.buyTime * 1000 * 60))) : false),
    "Trailing Stop": (rule, index) => this.intraDayChecked ? ('current' in rule.desiredAction ? (this.stockDataForSelectedDay[index].stockPrice <= rule.desiredAction.current) : false) : ('current' in rule.desiredAction ? (this.selectedInterDayStockData[index].close <= rule.desiredAction.current) : false),
    "Trend Crosses Below:": (rule, index) => ((index >= (rule.primaryObject.length + rule.desiredAction.length) - 2) ? (this.getTrend(rule.primaryObject.data, rule.desiredAction.length, index) < rule.desiredAction.amount) : false),
    "Trend Crosses Above:": (rule, index) => ((index >= (rule.primaryObject.length + rule.desiredAction.length) - 2) ? (this.getTrend(rule.primaryObject.data, rule.desiredAction.length, index) > rule.desiredAction.amount) : false),
    "Is greater than:": (rule, index) => (rule.primaryObject.data[index].value == null || rule.referencedObject.data[index].value == null) ? false : (rule.primaryObject.data[index].value > rule.referencedObject.data[index].value),
    "Is less than:": (rule, index) => (rule.primaryObject.data[index].value == null || rule.referencedObject.data[index].value == null) ? false : (rule.primaryObject.data[index].value < rule.referencedObject.data[index].value),
    "Is Greater than previous buy": (rule, index, buyPrice) => this.intraDayChecked ? (false) : (rule.primaryObject.data[index].value! > buyPrice!)
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

    if (this.intraDayChecked) {
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
          let buyArray: boolean[][] = [[]]

          for (let j = 0; j < this.listOfAddedRules.SellRules.length; j++) {
            if (this.listOfAddedRules.SellRules[j].desiredAction.type == 'Trailing Stop' && (this.stockDataForSelectedDay[i].stockPrice > this.listOfAddedRules.SellRules[j].tradeHigh)) {
              this.listOfAddedRules.SellRules[j].tradeHigh = this.stockDataForSelectedDay[i].stockPrice
              if (this.listOfAddedRules.SellRules[j].tradeHigh >= (orderLocations[orderLocations.length - 1].price + this.listOfAddedRules.SellRules[j].desiredAction.amount)) {
                this.listOfAddedRules.SellRules[j].desiredAction.current = this.listOfAddedRules.SellRules[j].tradeHigh - this.listOfAddedRules.SellRules[j].desiredAction.amount
              }
            }
            if (this.listOfAddedRules.SellRules[j].andOr == 'Or') {
              buyArray.push([])
              buyArray[buyArray.length - 1].push(this.operators[this.listOfAddedRules.SellRules[j].desiredAction.type](this.listOfAddedRules.SellRules[j], i, orderLocations[orderLocations.length - 1].price))
            }
            else {
              buyArray[buyArray.length - 1].push(this.operators[this.listOfAddedRules.SellRules[j].desiredAction.type](this.listOfAddedRules.SellRules[j], i, orderLocations[orderLocations.length - 1].price))
            }

          }
          if (i == this.stockDataForSelectedDay.length - 1) {
            orderLocations.push({ buySell: 'Sell', price: this.stockDataForSelectedDay[i].stockPrice, date: this.stockDataForSelectedDay[i].time, dateString: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() })
            profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
            buySell = 'Buy'
          }
          else {
            let shouldSell: boolean[] = []
            for (let i = 0; i < buyArray.length; i++) {
              shouldSell.push(buyArray[i].includes(false) ? false : true)
            }
            if (shouldSell.includes(true)) {
              orderLocations.push({ buySell: 'Sell', price: this.stockDataForSelectedDay[i].stockPrice, date: this.stockDataForSelectedDay[i].time, dateString: new Date(this.stockDataForSelectedDay[i].time).toLocaleTimeString() })
              profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price

              if (profit > 0) {
                //wins++
              }
              else {
                numberOfConsecutiveLosses++
                timeOutPeriod = (this.listOfAddedRules.TimeOutAfterStopLossSell * 60000) + this.stockDataForSelectedDay[i].time
                //losses++
              }
              buySell = 'Buy'
            }
          }


        }
      }
    }
    else {
      for (let i = counter; i < this.selectedInterDayStockData.length; i++) {
        if (buySell == 'Buy') {
          let buyArray = []
          for (let j = 0; j < this.listOfAddedRules.BuyRules.length; j++) {
            buyArray.push(this.operators[this.listOfAddedRules.BuyRules[j].desiredAction.type](this.listOfAddedRules.BuyRules[j], i))
          }
          if (!buyArray.includes(false) && this.selectedInterDayStockData[i].date >= timeOutPeriod && numberOfConsecutiveLosses < this.listOfAddedRules.NumberOfLossesInARowToStop) {
            orderLocations.push({ buySell: 'Buy', price: this.selectedInterDayStockData[i].close, date: this.selectedInterDayStockData[i].date, dateString: new Date(this.selectedInterDayStockData[i].date).toLocaleTimeString() })
            buySell = 'Sell'
            for (let j = 0; j < this.listOfAddedRules.SellRules.length; j++) {
              if (this.listOfAddedRules.SellRules[j].desiredAction.type == 'Trailing Stop') {
                this.listOfAddedRules.SellRules[j].desiredAction.current = 0
                this.listOfAddedRules.SellRules[j].tradeHigh = this.selectedInterDayStockData[i].close
              }
            }
          }
        }
        else {
          let buyArray: boolean[][] = [[]]

          for (let j = 0; j < this.listOfAddedRules.SellRules.length; j++) {
            if (this.listOfAddedRules.SellRules[j].desiredAction.type == 'Trailing Stop' && (this.selectedInterDayStockData[i].close > this.listOfAddedRules.SellRules[j].tradeHigh)) {
              this.listOfAddedRules.SellRules[j].tradeHigh = this.selectedInterDayStockData[i].close
              if (this.listOfAddedRules.SellRules[j].tradeHigh >= (orderLocations[orderLocations.length - 1].price + this.listOfAddedRules.SellRules[j].desiredAction.amount)) {
                this.listOfAddedRules.SellRules[j].desiredAction.current = this.listOfAddedRules.SellRules[j].tradeHigh - this.listOfAddedRules.SellRules[j].desiredAction.amount
              }
            }
            if (this.listOfAddedRules.SellRules[j].andOr == 'Or') {
              buyArray.push([])
              buyArray[buyArray.length - 1].push(this.operators[this.listOfAddedRules.SellRules[j].desiredAction.type](this.listOfAddedRules.SellRules[j], i, orderLocations[orderLocations.length - 1].price))
            }
            else {
              buyArray[buyArray.length - 1].push(this.operators[this.listOfAddedRules.SellRules[j].desiredAction.type](this.listOfAddedRules.SellRules[j], i, orderLocations[orderLocations.length - 1].price))
            }

          }
          if (i == this.selectedInterDayStockData.length - 1) {
            orderLocations.push({ buySell: 'Sell', price: this.selectedInterDayStockData[i].close, date: this.selectedInterDayStockData[i].date, dateString: new Date(this.selectedInterDayStockData[i].date).toLocaleTimeString() })
            profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price
            buySell = 'Buy'
          }
          else {
            let shouldSell: boolean[] = []
            for (let i = 0; i < buyArray.length; i++) {
              shouldSell.push(buyArray[i].includes(false) ? false : true)
            }
            if (shouldSell.includes(true)) {
              orderLocations.push({ buySell: 'Sell', price: this.selectedInterDayStockData[i].close, date: this.selectedInterDayStockData[i].date, dateString: new Date(this.selectedInterDayStockData[i].date).toLocaleTimeString() })
              profit += orderLocations[orderLocations.length - 1].price - orderLocations[orderLocations.length - 2].price

              if (profit > 0) {
                //wins++
              }
              else {
                numberOfConsecutiveLosses++
                timeOutPeriod = (this.listOfAddedRules.TimeOutAfterStopLossSell * 60000) + this.selectedInterDayStockData[i].date
                //losses++
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
      this.count++
    }
    return trend
  }
  async loadInitialInterDayData() {
    this.allHistory = await dbStockBasicHistoryRepo.find({ where: {}, orderBy: { stockName: 'asc', date: 'asc' } })
    //this.distinctStocks = this.allHistory.map(e => e.stockName).filter((v, i, a) => a.indexOf(v) === i)
    this.selectedStockName = this.distinctStocks[0].name
    this.selectedInterDayStockData = this.allHistory.filter(e => e.stockName == this.selectedStockName)
  }
  async onStockIsSelected(event: any) {
    this.selectedStockName = event.option.value
    //await this.get
  }

  async ngOnInit() {
    Chart.register(annotationPlugin);
    Chart.register(...registerables)
    Chart.register(zoomPlugin)
    this.isLoading = true
    this.distinctStocks = await tickerRepo.find()
    //this.filteredStocks = this.distinctStocks
    //await this.loadInitialInterDayData()
    this.intraDayChecked = true
    this.createOrUpdateChart()
    //await this.getStockHistoricalData()
    this.isLoading = false;

  }
}
