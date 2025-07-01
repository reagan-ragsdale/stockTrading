import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RuleDto } from '../../Dtos/ServerAlgoDto';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-algo-loop',
  imports: [CommonModule, MatDialogContent, MatDatepickerModule, MatCheckboxModule, MatSelectModule, MatIconModule, MatButtonToggleModule, MatDialogActions, MatDialogTitle, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './algo-loop.component.html',
  providers: [provideNativeDateAdapter()],
  styleUrl: './algo-loop.component.css'
})
export class AlgoLoopComponent {
  @Input() listOfRulesIncoming: RuleDto = {
    BuyRules: [],
    SellRules: [],
    NumberOfLossesInARowToStop: 0,
    TimeOutAfterStopLossSell: 0,
    StartDate: ''
  }
  readonly dialogRef = inject(MatDialogRef<AlgoLoopComponent>);

  onSelectedDateChange(event: MatDatepickerInputEvent<Date>) {
    this.listOfRulesIncoming.StartDate = new Date(event.value!).toISOString().split('T')[0]
  }


  onSubmit() {
    this.dialogRef.close(this.listOfRulesIncoming)
  }
}
