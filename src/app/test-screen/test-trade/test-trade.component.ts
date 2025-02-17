import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms'
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { stockOrder } from '../../Dtos/stockOrder';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { DbOrders } from '../../../shared/tasks/dbOrders.js';
import { RegressionOrderService } from '../../services/regressionOrderService.js';

@Component({
  selector: 'app-test-trade',
  imports: [CommonModule,MatDialogContent,MatCheckboxModule,MatButtonToggleModule,MatDialogActions,MatDialogClose,MatDialogTitle,MatButtonModule,MatFormFieldModule,MatInputModule,FormsModule],
  templateUrl: './test-trade.component.html',
  styleUrl: './test-trade.component.css'
})
export class TestTradeComponent {
  readonly dialogRef = inject(MatDialogRef<TestTradeComponent>);
  //readonly data = inject<any>(MAT_DIALOG_DATA);

  @Input() stockName: string = ''
  @Input() stockPrice: number = 0
  @Input() ownedShares: number = 0
  @Input() availableFunds: number = 0
  @Input() stockTime: number = 0 
  @Input() orderHistory: DbOrders = {
    userId: '',
    stockPrice: 0,
    shareQty: 0,
    stockName: '',
    orderTime: 0,
    orderType: ''
  }

  buyOrSell: string = 'Buy'
  sharedOrDollars: string = 'Dollars'

  amountToBuyOrSell: number = 0;
  isAllSharesChecked: boolean = false;

  async onPlaceTradeClicked(){
    if(this.amountToBuyOrSell > 0){
      if(this.sharedOrDollars == 'Dollars'){
        this.amountToBuyOrSell = this.amountToBuyOrSell / this.stockPrice
      }
      let order: stockOrder = {
        orderType: this.buyOrSell,
        stockName: this.stockName,
        stockPrice: this.stockPrice,
        shareQty: this.amountToBuyOrSell,
        orderTime: this.stockTime
  
      }
      await RegressionOrderService.executeOrder(order, this.orderHistory)
      this.dialogRef.close()
    }
    
  }

  getMaxToBuyOrSell(): number{
    let returnVal: number = 0
    if(this.buyOrSell == 'Buy'){
      if(this.sharedOrDollars == 'Shares'){
        returnVal = this.availableFunds / this.stockPrice
      }
      else{
        returnVal = this.availableFunds
      }
    }
    else{
      if(this.sharedOrDollars == 'Shares'){
        returnVal = this.ownedShares
      }
      else{
        returnVal = this.ownedShares * this.stockPrice
      }
    }
    return returnVal
  }

  sellAllSharesChecked(){
    this.amountToBuyOrSell = this.ownedShares
  }
  changeSharesDollars(event: any){
    this.sharedOrDollars = event.value
  }

  changeBuyOrSell(event: any){
    this.buyOrSell = event.value
  }

  ngOnChanges(){
  }
}
