import { Component, OnInit } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { OrderController } from '../../shared/controllers/OrderController';
import { DbOrders } from '../../shared/tasks/dbOrders';
import { MatTableModule } from '@angular/material/table';
import { EpochToTimePipe } from "../services/epochToTimePipe.pipe";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trade-history-detail',
  imports: [MatSelectModule, MatTableModule, EpochToTimePipe, CommonModule],
  templateUrl: './trade-history-detail.component.html',
  styleUrl: './trade-history-detail.component.css'
})
export class TradeHistoryDetailComponent implements OnInit{

  selectedStockName: string = ''
  isLoading: boolean = true
  distinctStocks: string[] = []
  selectedStockOrders: DbOrders[] = []
  displayedColumns: string[] = ["Trade", "Stock","Shares","Price","Time"]


  async onSelectedStockChange(event: any){
    if(event.isUserInput == true){
      this.selectedStockName = event.source.value
      await this.getStockOrders()
      this.isLoading = true
    }
  }

  async getStockOrders(){
    this.selectedStockOrders = await OrderController.getOrdersByStockName(this.selectedStockName)
  }

  async ngOnInit(){
    this.isLoading = true
    this.distinctStocks = await OrderController.getDistinctStocks()
    this.selectedStockName = this.distinctStocks[0]
    await this.getStockOrders()
    this.isLoading = false
  }

}
