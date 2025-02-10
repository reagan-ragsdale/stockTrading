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
import { OrderService } from '../../services/orderService.js';
import { stockOrder } from '../../Dtos/stockOrder';

@Component({
  selector: 'app-trade',
  imports: [MatDialogContent,MatButtonToggleModule,MatDialogActions,MatDialogClose,MatDialogTitle,MatButtonModule,MatFormFieldModule,MatInputModule,FormsModule],
  templateUrl: './trade.component.html',
  styleUrl: './trade.component.css'
})
export class TradeComponent {
  readonly dialogRef = inject(MatDialogRef<TradeComponent>);
  readonly data = inject<any>(MAT_DIALOG_DATA);

 /*  @Input() stockName: string = ''
  @Input() stockPrice: number = 0
  @Input() ownedShares: number = 0
  @Input() availableFunds: number = 0
  @Input() stockTime: number = 0 */

  buyOrSell: string = 'Buy'

  amountToBuyOrSell: number = 0;

  async onPlaceTradeClicked(){
    let order: stockOrder = {
      orderType: this.buyOrSell,
      stockName: this.data.stockName,
      stockPrice: this.data.stockPrice,
      shareQty: this.amountToBuyOrSell/this.data.stockPrice,
      orderTime: this.data.stockTime

    }
    let orderOpen = await OrderService.executeOrder(order)
  }

  changeBuyOrSell(event: any){
    this.buyOrSell = event.value
  }

  ngOnChanges(){
  }
}
