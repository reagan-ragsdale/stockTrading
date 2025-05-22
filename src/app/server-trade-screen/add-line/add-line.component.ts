import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { lineType } from '../../Dtos/ServerAlgoDto';


@Component({
  selector: 'app-add-line',
  imports: [CommonModule, MatDialogContent, MatCheckboxModule, MatSelectModule, MatIconModule, MatButtonToggleModule, MatDialogActions, MatDialogTitle, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './add-line.component.html',
  styleUrl: './add-line.component.css'
})
export class AddLineComponent implements OnInit {
  @Input() listOfLinesIncoming: lineType[] = []
  readonly dialogRef = inject(MatDialogRef<AddLineComponent>);

  lineTypes: string[] = ['SMA', 'EMA', 'Cumulative SMA', 'Cumulative EMA', 'Cumulative VWAP', 'Rolling VWAP', 'Bollinger Bands']
  addedListOfLines: lineType[] = []

  addLine() {
    this.addedListOfLines.push({
      id: this.addedListOfLines.length,
      lineLength: 1,
      lineType: '',
      data: []
    })
  }
  removeLine(id: number) {
    this.addedListOfLines = this.addedListOfLines.filter(e => e.id != id)
  }

  onSelectedLineTypeChange(event: any) {

  }

  onSubmit() {
    this.dialogRef.close(this.addedListOfLines)
  }

  ngOnInit() {
    this.addedListOfLines = structuredClone(this.listOfLinesIncoming)
    this.addedListOfLines = this.addedListOfLines.filter(e => e.lineType != 'Price' && e.id != -10 && e.id != -11 && e.id != -12)
  }


}
