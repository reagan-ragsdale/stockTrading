import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { OrderController } from '../../shared/controllers/OrderController';
import { DbOrders } from '../../shared/tasks/dbOrders';
import { MatTableModule } from '@angular/material/table';
import { EpochToTimePipe } from "../services/epochToTimePipe.pipe";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { SimFInance } from '../../shared/tasks/simFinance';
import { SimFinance } from '../../shared/controllers/SimFinance';
import { MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { remult } from "remult";
import { SchwabController } from '../../shared/controllers/SchwabController';
import { SchwabOrderDTO } from '../Dtos/TradingBotDtos';
import { dbTokenRepo, DbTOkens } from '../../shared/tasks/dbTokens';


@Component({
  selector: 'app-trade-history-detail',
  providers: [provideNativeDateAdapter()],
  imports: [MatSelectModule, FormsModule, MatTableModule, CommonModule, MatInputModule, MatButtonModule, MatFormFieldModule, MatDatepickerModule, MatNativeDateModule, MatRippleModule],
  templateUrl: './trade-history-detail.component.html',
  styleUrl: './trade-history-detail.component.css'
})
export class TradeHistoryDetailComponent implements OnInit {
  @ViewChild('picker') picker: MatDateRangePicker<Date> | undefined;

  startDate: string = ''
  endDate: string = ''
  remult = remult;
  selectedStockName: string = ''
  isLoading: boolean = true
  distinctStocks: string[] = ['All']
  selectedStockOrders: DbOrders[] = []
  displayedColumns: string[] = ["Trade", "Stock", "Shares", "Price", "Date", "Time", 'Trade Strategy']
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
  distinctStrategies: string[] = ['All']
  selectedStrategy: string = ''



  async onSelectedStockChange(event: any) {
    if (event.isUserInput == true) {
      this.selectedStockName = event.source.value
      //await this.getStockOrders()
      //this.isLoading = true
    }
  }
  onSelectedStrategChange(event: any) {
    if (event.isUserInput == true) {
      this.selectedStrategy = event.source.value
    }
  }
  onSelectedDateTypeChange(event: any) {
    if (event.isUserInput == true) {
      this.dateType = event.source.value
    }
  }
  addEvent(event: any) {
    console.log(event.value)
  }

  async getStockOrders() {
    this.selectedStockOrders = await OrderController.getSharedOrdersByStockName(this.selectedStockName)
  }
  async onSubmitSearch() {
    this.allOrders = await OrderController.getAllSharedOrders()
    if (this.selectedStockName == 'All') {
      if (this.dateType == 'All') {
        if (this.selectedStrategy == 'All') {
          this.selectedStockOrders = this.allOrders
        }
        else {
          this.selectedStockOrders = this.allOrders.filter(e => e.tradeStrategy == this.selectedStrategy)
        }

      }
      else if (this.dateType == 'Today') {
        if (this.selectedStrategy == 'All') {
          this.selectedStockOrders = this.allOrders.filter(e => this.convertEpochToDate(e.orderTime) == this.getCurrentDateFormat())
        }
        else {
          this.selectedStockOrders = this.allOrders.filter(e => this.convertEpochToDate(e.orderTime) == this.getCurrentDateFormat() && e.tradeStrategy == this.selectedStrategy)
        }

      }
      else if (this.dateType == 'This Week') {

        if (this.selectedStrategy == 'All') {
          this.selectedStockOrders = this.allOrders.filter(e => this.isSameCalendarWeek(e.orderTime))
        }
        else {
          this.selectedStockOrders = this.allOrders.filter(e => this.isSameCalendarWeek(e.orderTime) && e.tradeStrategy == this.selectedStrategy)
        }
      }
      else if (this.dateType == 'This Month') {

      }
      else if (this.dateType == 'Choose Date') {
        let startTime = new Date(this.startDate)
        let endTime = new Date(this.endDate)
        endTime.setHours(23, 0, 0, 0)
        if (this.selectedStrategy == 'All') {
          this.selectedStockOrders = this.allOrders.filter(e => e.orderTime >= startTime.getTime() && e.orderTime <= endTime.getTime())
        }
        else {
          this.selectedStockOrders = this.allOrders.filter(e => e.orderTime >= startTime.getTime() && e.orderTime <= endTime.getTime() && e.tradeStrategy == this.selectedStrategy)
        }

      }
    }
    else {
      if (this.dateType == 'All') {
        if (this.selectedStrategy == 'All') {
          this.selectedStockOrders = this.allOrders.filter(e => e.stockName == this.selectedStockName)
        }
        else {
          this.selectedStockOrders = this.allOrders.filter(e => e.stockName == this.selectedStockName && e.tradeStrategy == this.selectedStrategy)
        }

      }
      else if (this.dateType == 'Today') {
        if (this.selectedStrategy == 'All') {
          this.selectedStockOrders = this.allOrders.filter(e => e.stockName == this.selectedStockName && this.convertEpochToDate(e.orderTime) == this.getCurrentDateFormat())
        }
        else {
          this.selectedStockOrders = this.allOrders.filter(e => e.stockName == this.selectedStockName && this.convertEpochToDate(e.orderTime) == this.getCurrentDateFormat() && e.tradeStrategy == this.selectedStrategy)
        }

      }
      else if (this.dateType == 'This Week') {
        if (this.selectedStrategy == 'All') {
          this.selectedStockOrders = this.allOrders.filter(e => this.isSameCalendarWeek(e.orderTime) && e.stockName == this.selectedStockName)
        }
        else {
          this.selectedStockOrders = this.allOrders.filter(e => this.isSameCalendarWeek(e.orderTime) && e.stockName == this.selectedStockName && e.tradeStrategy == this.selectedStrategy)
        }

      }
      else if (this.dateType == 'This Month') {

      }
      else if (this.dateType == 'Choose Date') {
        let startTime = new Date(this.startDate)
        let endTime = new Date(this.endDate)
        endTime.setHours(23, 0, 0, 0)
        if (this.selectedStrategy == 'All') {
          this.selectedStockOrders = this.allOrders.filter(e => e.orderTime >= startTime.getTime() && e.orderTime <= endTime.getTime() && e.stockName == this.selectedStockName)
        }
        else {
          this.selectedStockOrders = this.allOrders.filter(e => e.orderTime >= startTime.getTime() && e.orderTime <= endTime.getTime() && e.stockName == this.selectedStockName && e.tradeStrategy == this.selectedStrategy)
        }

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

    let distinctTradeStrategies = this.selectedStockOrders.map(e => e.tradeStrategy).filter((v, i, a) => a.indexOf(v) === i)
    for (let k = 0; k < distinctTradeStrategies.length; k++) {
      let filteredStocks = this.selectedStockOrders.filter(e => e.tradeStrategy == distinctTradeStrategies[k])
      let distinctStocks = filteredStocks.map(e => e.stockName).filter((v, i, a) => a.indexOf(v) === i)
      for (let j = 0; j < distinctStocks.length; j++) {
        let filteredStockOrders = this.selectedStockOrders.filter(e => e.stockName == distinctStocks[j] && e.tradeStrategy == distinctTradeStrategies[k])
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
    }


    this.percentChange = this.totalProfit / (this.userSimFinData[0].spending - this.totalProfit)
    this.averageWinAmt = this.totalWins == 0 ? 0 : (totalWinAmt / this.totalWins)
    this.averageLossAmt = this.totalLosses == 0 ? 0 : (totalLossAmt / this.totalLosses)
  }
  getTime(epoch: number): string {
    let returnTime = new Date(epoch).toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
    })
    return returnTime
  }

  async onBuy() {
    let order: SchwabOrderDTO = {
      orderType: "MARKET",
      session: "NORMAL",
      duration: "DAY",
      orderStrategyType: "SINGLE",
      orderLegCollection: [
        {
          instruction: "BUY",
          quantity: 1,
          instrument: {
            symbol: "SID",
            assetType: "EQUITY"
          }
        }
      ]
    }
    let response = await SchwabController.placeOrdersCall(this.userData, order)
    console.log('buy response below')
    console.log(response)
    let schwabOrders = await SchwabController.getOrdersCall(this.userData)
    console.log('buy orders below')
    console.log(schwabOrders)
    let schwabPosition = await SchwabController.getAccountInfoCall(this.userData)
    console.log('buy schwab positions below')
    console.log(schwabPosition)
  }
  async onSell() {
    let order: SchwabOrderDTO = {
      orderType: "MARKET",
      session: "NORMAL",
      duration: "DAY",
      orderStrategyType: "SINGLE",
      orderLegCollection: [
        {
          instruction: "SELL",
          quantity: 1,
          instrument: {
            symbol: "SID",
            assetType: "EQUITY"
          }
        }
      ]
    }
    let response = await SchwabController.placeOrdersCall(this.userData, order)
    console.log('response sell below')
    console.log(response)
    let schwabOrders = await SchwabController.getOrdersCall(this.userData)
    console.log('sell orders below')
    console.log(schwabOrders)
    let schwabPosition = await SchwabController.getAccountInfoCall(this.userData)
    console.log('sell schwab positions below')
    console.log(schwabPosition)
  }
  async getOrders() {
    let schwabOrders = await SchwabController.getOrdersCall(this.userData)
    console.log('get orders below')
    console.log(schwabOrders)
  }
  async getAccount() {
    let schwabPosition = await SchwabController.getAccountInfoCall(this.userData)
    console.log('get schwab positions below')
    console.log(schwabPosition)
  }

  public userData!: DbTOkens
  async ngOnInit() {
    this.isLoading = true
    this.allOrders = await OrderController.getAllSharedOrders()
    this.distinctStocks = this.distinctStocks.concat(this.allOrders.map(e => e.stockName).filter((v, i, a) => a.indexOf(v) === i))
    this.selectedStockName = this.distinctStocks[0]
    this.selectedStockOrders = this.allOrders
    this.distinctStrategies = this.distinctStrategies.concat(this.allOrders.map(e => e.tradeStrategy).filter((v, i, a) => a.indexOf(v) === i).filter(e => e != ''))
    this.selectedStrategy = this.distinctStrategies[0]
    await this.getUserFinanceData()
    this.claculateOrderDetails()
    this.userData = await dbTokenRepo.findFirst({ id: 'asdfghjkl' }) as DbTOkens




    //await this.getStockOrders()
    this.isLoading = false
  }

}
