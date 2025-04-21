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

type lineType = {
  id: number,
  smaLength: number
}
@Component({
  selector: 'app-add-graph',
  imports: [CommonModule,MatDialogContent,MatCheckboxModule,MatIconModule,MatButtonToggleModule,MatDialogActions,MatDialogClose,MatDialogTitle,MatButtonModule,MatFormFieldModule,MatInputModule,FormsModule],
  templateUrl: './add-graph.component.html',
  styleUrl: './add-graph.component.css'
})

export class AddGraphComponent {

  @Input() listOfLinesIncoming: lineType[] = []

  readonly dialogRef = inject(MatDialogRef<AddGraphComponent>);



  addLine(){
    this.listOfLinesIncoming.push({
      id: this.listOfLinesIncoming.length,
      smaLength: 60
    })
  }
  removeLine(id: number){
    this.listOfLinesIncoming = this.listOfLinesIncoming.filter(e => e.id != id)
  }

  onSubmit(){
    this.dialogRef.close(this.listOfLinesIncoming)
  }
}
