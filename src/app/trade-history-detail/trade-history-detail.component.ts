import { Component, OnInit } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { OrderController } from '../../shared/controllers/OrderController';
import { DbOrders } from '../../shared/tasks/dbOrders';
import { MatTableModule } from '@angular/material/table';
import { EpochToTimePipe } from "../services/epochToTimePipe.pipe";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { SimFInance } from '../../shared/tasks/simFinance';
import { SimFinance } from '../../shared/controllers/SimFinance';
import {MatDatepickerModule} from '@angular/material/datepicker';

@Component({
  selector: 'app-trade-history-detail',
  imports: [MatSelectModule, MatTableModule, EpochToTimePipe, CommonModule, MatButtonModule, MatDatepickerModule],
  templateUrl: './trade-history-detail.component.html',
  styleUrl: './trade-history-detail.component.css'
})
export class TradeHistoryDetailComponent implements OnInit {

  selectedStockName: string = ''
  isLoading: boolean = true
  distinctStocks: string[] = ['All']
  selectedStockOrders: DbOrders[] = []
  displayedColumns: string[] = ["Trade", "Stock", "Shares", "Price", "Date", "Time"]
  dateTypes: string[] = ['All', 'Today', 'This Week', 'This Month', 'Choose Date']
  dateType: string = this.dateTypes[0]
  allOrders: DbOrders[] = []
  totalProfit: number = 0
  totalWins: number = 0
  totalLosses: number = 0
  averageWinAmt: number = 0
  averageLossAmt: number = 0
  userSimFinData: SimFInance[] = []
  percentChange: number = 0


  async onSelectedStockChange(event: any) {
    if (event.isUserInput == true) {
      this.selectedStockName = event.source.value
      //await this.getStockOrders()
      //this.isLoading = true
    }
  }
  onSelectedDateTypeChange(event: any) {
    if (event.isUserInput == true) {
      this.dateType = event.source.value
    }
  }

  async getStockOrders() {
    this.selectedStockOrders = await OrderController.getOrdersByStockName(this.selectedStockName)
  }
  async onSubmitSearch() {
    if (this.selectedStockName == 'All') {
      if (this.dateType == 'All') {
        this.selectedStockOrders = this.allOrders
      }
      else if (this.dateType == 'Today') {
        this.selectedStockOrders = this.allOrders.filter(e => this.convertEpochToDate(e.orderTime) == this.getCurrentDateFormat())
      }
      else if (this.dateType == 'This Week') {
        this.selectedStockOrders = this.allOrders.filter(e => this.isSameCalendarWeek(e.orderTime))
      }
      else if (this.dateType == 'This Month') {

      }
      else if (this.dateType == 'Choose Date') {

      }
    }
    else {
      if (this.dateType == 'All') {
        this.selectedStockOrders = this.allOrders.filter(e => e.stockName == this.selectedStockName)
      }
      else if (this.dateType == 'Today') {
        this.selectedStockOrders = this.allOrders.filter(e => e.stockName == this.selectedStockName && this.convertEpochToDate(e.orderTime) == this.getCurrentDateFormat())
      }
      else if (this.dateType == 'This Week') {
        this.selectedStockOrders = this.allOrders.filter(e => this.isSameCalendarWeek(e.orderTime) && e.stockName == this.selectedStockName)
      }
      else if (this.dateType == 'This Month') {

      }
      else if (this.dateType == 'Choose Date') {

      }
    }
    this.claculateOrderDetails()
  }
  convertEpochToDate(epoch: number): string {
    const date = new Date(epoch); // Convert to milliseconds if necessary

    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  }
  convertEpochToDateNumber(epoch: number): number {
    const date = new Date(epoch); // Convert to milliseconds if necessary

    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return Number(`${month}${day}${year}`);
  }
  getCurrentDateFormat(): string {
    const date = new Date();

    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  }
  isSameCalendarWeek(epoch: number, referenceDate: Date = new Date()): boolean {
    const date = new Date(epoch); // Convert if necessary

    const referenceYear = referenceDate.getFullYear();
    const referenceWeek = this.getWeekNumber(referenceDate);

    const dateYear = date.getFullYear();
    const dateWeek = this.getWeekNumber(date);

    return referenceYear === dateYear && referenceWeek === dateWeek;
  }

  getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDays = Math.floor((date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
  }
  async getUserFinanceData() {
      this.userSimFinData = await SimFinance.getSimFinData()
  }

  claculateOrderDetails() {
    this.totalProfit = 0
    this.totalWins = 0
    this.totalLosses = 0
    this.averageWinAmt = 0
    this.averageLossAmt = 0

    let totalWinAmt: number = 0
    let totalLossAmt: number = 0
    let distinctStocks = this.selectedStockOrders.map(e => e.stockName).filter((v,i,a) => a.indexOf(v) === i)
    for(let j = 0; j < distinctStocks.length; j++){
      let filteredStockOrders = this.selectedStockOrders.filter(e => e.stockName == distinctStocks[j])
      for (let i = 0; i < filteredStockOrders.length - 1; i++) {
        //need to find each pair of buy and sells
        if (filteredStockOrders[i].orderType == 'Sell' && filteredStockOrders[i + 1].orderType == 'Buy') {
          let profitShare = (filteredStockOrders[i].stockPrice - filteredStockOrders[i + 1].stockPrice)
          let profit = ((filteredStockOrders[i].shareQty * filteredStockOrders[i].stockPrice) - (filteredStockOrders[i + 1].stockPrice * filteredStockOrders[i + 1].shareQty))
          this.totalProfit += profit
          if (profitShare > 0) {
            this.totalWins++
            totalWinAmt += profitShare
          }
          else {
            this.totalLosses++
            totalLossAmt += profitShare
          }
        }
      }
    }
    
    this.percentChange = this.totalProfit / (this.userSimFinData[0].spending - this.totalProfit) 
    this.averageWinAmt = this.totalWins == 0 ? 0 : (totalWinAmt / this.totalWins)
    this.averageLossAmt = this.totalLosses == 0 ? 0 : (totalLossAmt / this.totalLosses)
  }

  async ngOnInit() {
    this.isLoading = true
    this.allOrders = await OrderController.getAllOrders()
    this.distinctStocks = this.distinctStocks.concat(this.allOrders.map(e => e.stockName).filter((v, i, a) => a.indexOf(v) === i))
    this.selectedStockName = this.distinctStocks[0]
    this.selectedStockOrders = this.allOrders
    await this.getUserFinanceData()
    this.claculateOrderDetails()
    //await this.getStockOrders()
    this.isLoading = false
  }

}
