import { CommonModule } from '@angular/common';
import { Component, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { lineType } from '../../Dtos/ServerAlgoDto';


@Component({
  selector: 'app-add-graph',
  imports: [CommonModule, MatDialogContent, MatCheckboxModule, MatIconModule, MatButtonToggleModule, MatDialogActions, MatDialogTitle, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatSelectModule],
  templateUrl: './add-graph.component.html',
  styleUrl: './add-graph.component.css'
})

export class AddGraphComponent {

  @Input() listOfLinesIncoming: lineType[] = []
  @Input() stockDataLength: number = 0

  readonly dialogRef = inject(MatDialogRef<AddGraphComponent>);

  lineTypes: string[] = ['SMA', 'EMA', 'Cumulative VWAP', 'Rolling VWAP', 'Cumulative SMA']


  addLine() {
    this.listOfLinesIncoming.push({
      id: this.listOfLinesIncoming.length,
      lineType: '',
      lineLength: 0,
      data: [],
      channelFactor: 0
    })
  }
  notCumulative(lineType: string): boolean {
    return !(lineType == 'Cumulative VWAP' || lineType == 'Cumulative SMA')
  }
  removeLine(id: number) {
    this.listOfLinesIncoming = this.listOfLinesIncoming.filter(e => e.id != id)
  }

  onSubmit() {
    this.dialogRef.close(this.listOfLinesIncoming)
  }
}
