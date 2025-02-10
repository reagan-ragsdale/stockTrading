import { Component, inject, Input } from '@angular/core';
import {
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
import { SimFinance } from '../../../shared/controllers/SimFinance';

@Component({
  selector: 'app-add-funds',
  imports: [MatDialogContent,MatDialogActions,MatDialogClose,MatDialogTitle,MatButtonModule,MatFormFieldModule,MatInputModule,FormsModule],
  templateUrl: './add-funds.component.html',
  styleUrl: './add-funds.component.css'
})
export class AddFundsComponent {
  addAmount: number = 0;

  readonly dialogRef = inject(MatDialogRef<AddFundsComponent>);
  

  async OnAddFundsClicked(){
    if(this.addAmount > 0){
      await SimFinance.insertOrUpdateAmount(this.addAmount)
      this.dialogRef.close()
    }
    
  }

}
