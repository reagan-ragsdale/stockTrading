import { Component, inject } from '@angular/core';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

@Component({
  selector: 'app-add-funds',
  imports: [MatDialogContent,MatDialogActions,MatDialogClose,MatDialogTitle],
  templateUrl: './add-funds.component.html',
  styleUrl: './add-funds.component.css'
})
export class AddFundsComponent {

  readonly dialogRef = inject(MatDialogRef<AddFundsComponent>);

}
