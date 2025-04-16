import { CommonModule } from '@angular/common';
import { Component, inject, Output } from '@angular/core';
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
  length: number
}
@Component({
  selector: 'app-add-graph',
  imports: [CommonModule,MatDialogContent,MatCheckboxModule,MatIconModule,MatButtonToggleModule,MatDialogActions,MatDialogClose,MatDialogTitle,MatButtonModule,MatFormFieldModule,MatInputModule,FormsModule],
  templateUrl: './add-graph.component.html',
  styleUrl: './add-graph.component.css'
})

export class AddGraphComponent {
  readonly dialogRef = inject(MatDialogRef<AddGraphComponent>);

  listOfLines: lineType[] = [] 

  addLine(){
    this.listOfLines.push({
      id: this.listOfLines.length,
      length: 60
    })
  }
  removeLine(id: number){
    this.listOfLines = this.listOfLines.filter(e => e.id != id)
  }

  onSubmit(){
    this.dialogRef.close(this.listOfLines)
  }
}
