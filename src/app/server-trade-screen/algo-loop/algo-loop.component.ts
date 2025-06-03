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

@Component({
  selector: 'app-algo-loop',
  imports: [CommonModule, MatDialogContent, MatCheckboxModule, MatSelectModule, MatIconModule, MatButtonToggleModule, MatDialogActions, MatDialogTitle, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './algo-loop.component.html',
  styleUrl: './algo-loop.component.css'
})
export class AlgoLoopComponent {
  @Input() listOfRulesIncoming: RuleDto = {
    BuyRules: [],
    SellRules: [],
    NumberOfLossesInARowToStop: 0,
    TimeOutAfterStopLossSell: 0
  }
  readonly dialogRef = inject(MatDialogRef<AlgoLoopComponent>);




  onSubmit() {
    this.dialogRef.close(this.listOfRulesIncoming)
  }
}
