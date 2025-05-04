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


type lineType = {
  id: number;
  smaLength: number;
  lineType: string;
}
@Component({
  selector: 'app-add-line',
  imports: [CommonModule,MatDialogContent,MatCheckboxModule,MatSelectModule,MatIconModule,MatButtonToggleModule,MatDialogActions,MatDialogTitle,MatButtonModule,MatFormFieldModule,MatInputModule,FormsModule],
  templateUrl: './add-line.component.html',
  styleUrl: './add-line.component.css'
})
export class AddLineComponent {
@Input() listOfLinesIncoming: lineType[] = []
readonly dialogRef = inject(MatDialogRef<AddLineComponent>);

lineTypes: string[] = ['SMA', 'EMA']

addLine(){
  this.listOfLinesIncoming.push({
    id: this.listOfLinesIncoming.length,
    smaLength: 1,
    lineType: ''
  })
}
removeLine(id:number){
  this.listOfLinesIncoming = this.listOfLinesIncoming.filter(e => e.id != id)
}

onSelectedLineTypeChange(event: any){

}

onSubmit(){
  this.dialogRef.close(this.listOfLinesIncoming)
}


}
