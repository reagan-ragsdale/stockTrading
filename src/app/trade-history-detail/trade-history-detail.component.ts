import { Component, OnInit } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { OrderController } from '../../shared/controllers/OrderController';
import { DbOrders } from '../../shared/tasks/dbOrders';
import { MatTableModule } from '@angular/material/table';
import { EpochToTimePipe } from "../services/epochToTimePipe.pipe";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-trade-history-detail',
  imports: [MatSelectModule, MatTableModule, EpochToTimePipe, CommonModule, MatButtonModule],
  templateUrl: './trade-history-detail.component.html',
  styleUrl: './trade-history-detail.component.css'
})
export class TradeHistoryDetailComponent implements OnInit{

  selectedStockName: string = ''
  isLoading: boolean = true
  distinctStocks: string[] = ['All']
  selectedStockOrders: DbOrders[] = []
  displayedColumns: string[] = ["Trade", "Stock","Shares","Price","Date","Time"]
  dateTypes: string[] = ['All', 'Today', 'Last 7', 'Last Month', 'Choose Date']
  dateType: string = this.dateTypes[0]
  allOrders: DbOrders[] = []


  async onSelectedStockChange(event: any){
    if(event.isUserInput == true){
      this.selectedStockName = event.source.value
      //await this.getStockOrders()
      //this.isLoading = true
    }
  }
  onSelectedDateTypeChange(event: any){
    if(event.isUserInput == true){
      this.dateType = event.source.value
    }
  }

  async getStockOrders(){
    this.selectedStockOrders = await OrderController.getOrdersByStockName(this.selectedStockName)
  }
  async onSubmitSearch(){
    if(this.selectedStockName == 'All'){
      if(this.dateType == 'All'){
        this.selectedStockOrders = this.allOrders
      }
    }
    else{
      if(this.dateType == 'All'){
        this.selectedStockOrders = this.allOrders.filter(e => e.stockName == this.selectedStockName)
      }
    }
  }
  convertEpochToDate(epoch: number): Date{
    return new Date(epoch)
  }

  async ngOnInit(){
    this.isLoading = true
    this.allOrders = await OrderController.getAllOrders()
    this.distinctStocks = this.distinctStocks.concat(this.allOrders.map(e => e.stockName).filter((v,i,a) => a.indexOf(v) === i))
    this.selectedStockName = this.distinctStocks[0]
    this.selectedStockOrders = this.allOrders
    //await this.getStockOrders()
    this.isLoading = false
  }

}
