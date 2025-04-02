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
type serverAlgos = {
  name: string;
  isSelected: boolean;
}
type sma200Array = {
  stockName: string;
  close: number;
  avg: number;
  date: number;
}
@Component({
  selector: 'app-server-trade-screen',
  imports: [MatCheckboxModule, CommonModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  templateUrl: './server-trade-screen.component.html',
  styleUrl: './server-trade-screen.component.css'
})

export class ServerTradeScreenComponent implements OnInit {
  listOfServerAlgos: serverAlgos[] = []
  userAlgos: DbAlgorithmList | undefined = undefined
  listOfLast200Days: sma200Array[] = []
  listOfLast50Days: sma200Array[] = []
  selectedStockName: string = ''
  selectedStockLast200: sma200Array[] = []
  selectedStockLast50: sma200Array[] = []
  stockChart: any;
  distinctStocks: string[] = []

  async saveAlgos() {
    await dbAlgorithmListRepo.save({ ...this.userAlgos, sma200sma50: this.listOfServerAlgos[0].isSelected })
  }
  getStockDisplay() {
    this.selectedStockLast200 = this.listOfLast200Days.filter(e => e.stockName == this.selectedStockName)
    this.selectedStockLast50 = this.listOfLast50Days.filter(e => e.stockName == this.selectedStockName)
    console.log(this.selectedStockLast200)
  }
  onSelectedStockChange(event: any) {
    if (event.isUserInput == true) {
      this.selectedStockName = event.source.value
      this.getStockDisplay()
      this.updateChart()
    }
  }
  updateChart() {
    this.stockChart.data.datasets[0].data = this.selectedStockLast200.map(e => e.avg)
    this.stockChart.data.datasets[1].data = this.selectedStockLast50.map(e => e.avg)
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
            data: this.selectedStockLast50.map(e => e.close),
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
            backgroundColor: '#fe0303',
            hoverBackgroundColor: '#fe0303',
            borderColor: '#fe0303',
            pointBackgroundColor: '#fe0303',
            pointBorderColor: '#fe0303',
            pointRadius: 0,
            spanGaps: true
          },
          {
            label: '50',
            data: this.selectedStockLast50.map(e => e.avg),
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
  async ngOnInit() {
    Chart.register(annotationPlugin);
    Chart.register(...registerables)
    this.userAlgos = await dbAlgorithmListRepo.findFirst({ userId: remult.user?.id })
    this.listOfServerAlgos.push({
      name: 'SMA:50/200',
      isSelected: this.userAlgos!.sma200sma50
    })
    let allHistory = await dbStockBasicHistoryRepo.find({ orderBy: { stockName: 'desc', date: 'asc' } })
    this.distinctStocks = allHistory.map(e => e.stockName).filter((v, i, a) => a.indexOf(v) === i)
    this.selectedStockName = this.distinctStocks[0]
    for (let i = 0; i < this.distinctStocks.length; i++) {
      let filteredStock = allHistory.filter(e => e.stockName == this.distinctStocks[i])
      let tempStock200: sma200Array[] = []
      for(let j = 200; j < filteredStock.length; j++){
        let last200Price: number = 0;
        for(let k = 1; k < 200; k++){
          last200Price += filteredStock[j - k].close
        }
        let last200Avg = last200Price/200
        tempStock200.push({stockName: this.distinctStocks[i], close: filteredStock[j].close, avg: last200Avg, date: filteredStock[j].date})
      }
      let tempStock50: sma200Array[] = []
      for(let j = 200; j < filteredStock.length; j++){
        let last50Price: number = 0;
        for(let k = 1; k < 50; k++){
          last50Price += filteredStock[j - k].close
        }
        let last200Avg = last50Price/50
        tempStock50.push({stockName: this.distinctStocks[i], close: filteredStock[j].close, avg: last200Avg, date: filteredStock[j].date})
      }
      this.listOfLast200Days.push(...tempStock200)
      this.listOfLast50Days.push(...tempStock50)
    }
    this.getStockDisplay()
    this.createOrUpdateChart()


  }
}
