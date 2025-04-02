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
@Component({
  selector: 'app-server-trade-screen',
  imports: [MatCheckboxModule, CommonModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatInputModule, FormsModule],
  templateUrl: './server-trade-screen.component.html',
  styleUrl: './server-trade-screen.component.css'
})

export class ServerTradeScreenComponent implements OnInit {
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

  async saveAlgos() {
    await dbAlgorithmListRepo.save({ ...this.userAlgos, sma200sma50: this.listOfServerAlgos[0].isSelected })
  }
  getStockDisplay() {
    this.selectedStockLast200 = this.listOfLast200Days.filter(e => e.stockName == this.selectedStockName)
    this.selectedStockLast40 = this.listOfLast40Days.filter(e => e.stockName == this.selectedStockName)
    this.selectedStockLast5 = this.listOfLast5Days.filter(e => e.stockName == this.selectedStockName)
    console.log(this.selectedStockLast200)
  }
  onSelectedStockChange(event: any) {
    if (event.isUserInput == true) {
      this.selectedStockName = event.source.value
      this.getStockDisplay()
      this.updateChart()
      this.runSimulation()
    }
  }
  updateChart() {
    this.stockChart.data.datasets[0].data = this.selectedStockLast200.map(e => e.close)
    this.stockChart.data.datasets[1].data = this.selectedStockLast200.map(e => e.avg)
    this.stockChart.data.datasets[2].data = this.selectedStockLast40.map(e => e.avg)
    this.stockChart.data.datasets[3].data = this.selectedStockLast5.map(e => e.avg)
    this.stockChart.data.labels = this.selectedStockLast200.map(e => e.date)
    this.stockChart.options.scales.y.max = this.getMaxForChart(this.selectedStockLast200)
    this.stockChart.options.scales.y.min = this.getMinForChart(this.selectedStockLast200)
    this.stockChart.update()
  }

  createOrUpdateChart() {

    console.log('create chart')
    this.stockChart = new Chart("stock-chart", {
      type: 'line', //this denotes tha type of chart

      data: {// values on X-Axis

        labels: this.selectedStockLast200.map(e => e.date),

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
        tempStock200.push({ stockName: this.distinctStocks[i], close: filteredStock[j].close, avg: last200Avg, date: new Date(filteredStock[j].date).toLocaleDateString() })
      }
      let tempStock40: sma200Array[] = []
      for (let j = 200; j < filteredStock.length; j++) {
        let last50Price: number = 0;
        for (let k = 0; k < 40; k++) {
          last50Price += filteredStock[j - k].close
        }
        let last200Avg = last50Price / 40
        tempStock40.push({ stockName: this.distinctStocks[i], close: filteredStock[j].close, avg: last200Avg, date: new Date(filteredStock[j].date).toLocaleDateString() })
      }
      let tempStock5: sma200Array[] = []
      for (let j = 200; j < filteredStock.length; j++) {
        let last50Price: number = 0;
        for (let k = 0; k < 5; k++) {
          last50Price += filteredStock[j - k].close
        }
        let last200Avg = last50Price / 5
        tempStock5.push({ stockName: this.distinctStocks[i], close: filteredStock[j].close, avg: last200Avg, date: new Date(filteredStock[j].date).toLocaleDateString() })
      }
      this.listOfLast200Days.push(...tempStock200)
      this.listOfLast40Days.push(...tempStock40)
      this.listOfLast5Days.push(...tempStock5)
    }
  }
  buyGutter: number = .05;
  sellGutter: number = .15;
  check200Gutter: number = .1;
  shouldDisplayBuySellLines: boolean = false;
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
    console.log(this.orderLocations)
  }
  bankTotal: number = 500
  orderLocations: any[] = []
  executeOrder(arr: sma200Array, buySell: string) {
    if (buySell == 'Buy') {
      this.bankTotal -= arr.close
      this.orderLocations.push({ buySell: 'Buy', date: arr.date, price: arr.close })
    }
    else {
      this.bankTotal += arr.close
      this.orderLocations.push({ buySell: 'Sell', date: arr.date, price: arr.close })
    }
  }
  updateGraphBuyAndSellPoints() {
    this.annotationsArray = []
    for (let i = 0; i < this.orderLocations.length; i++) {
      this.annotationsArray.push({
        type: 'line',
        //display: this.selectedStockHistoryData.length > 0,
        xMin: this.selectedStockLast200.findIndex(x => x.date == this.orderLocations[i].date),
        xMax: this.selectedStockLast200.findIndex(x => x.date == this.orderLocations[i].date),
        borderColor: '#7874ff',
        borderWidth: 2,
        label: {
          display: true,
          content: this.orderLocations[i].buySell + ': ' + this.orderLocations[i].price,
          position: 'end'
        }
      })
    }
    console.log(this.annotationsArray)
    this.stockChart.options.plugins.annotation.annotations = this.annotationsArray
    this.stockChart.update()
  }
  totalPofit: number = 0;

  calculateTotalProfit(){
    for(let i = 0; i < this.orderLocations.length; i++){
      if(this.orderLocations[i].buySell == 'Sell'){
        this.totalPofit += this.orderLocations[i].price - this.orderLocations[i - 1].price
      }
    }
  }
  runSimulation() {
    this.bankTotal = 500
    this.orderLocations = []
    this.calculateBuyAndSellPoints()
    this.updateGraphBuyAndSellPoints()
    this.calculateTotalProfit()
  }
  async ngOnInit() {
    Chart.register(annotationPlugin);
    Chart.register(...registerables)
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


  }
}
