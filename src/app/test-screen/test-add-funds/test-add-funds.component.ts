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
import { RegFinanceController } from '../../../shared/controllers/regressionFInanceController';

@Component({
  selector: 'app-test-add-funds',
  imports: [MatDialogContent,MatDialogActions,MatDialogClose,MatDialogTitle,MatButtonModule,MatFormFieldModule,MatInputModule,FormsModule],
  templateUrl: './test-add-funds.component.html',
  styleUrl: './test-add-funds.component.css'
})
export class TestAddFundsComponent {
  addAmount: number = 0;

  readonly dialogRef = inject(MatDialogRef<TestAddFundsComponent>);
  

  async OnAddFundsClicked(){
    if(this.addAmount > 0){
      await RegFinanceController.insertOrUpdateAmountReg(this.addAmount)
      this.dialogRef.close()
    }
    
  }

}
