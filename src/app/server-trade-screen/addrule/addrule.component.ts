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
import { lineType, RuleDto } from '../../Dtos/ServerAlgoDto';


@Component({
  selector: 'app-add-rule',
  imports: [CommonModule, MatDialogContent, MatCheckboxModule, MatSelectModule, MatIconModule, MatButtonToggleModule, MatDialogActions, MatDialogTitle, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './addrule.component.html',
  styleUrl: './addrule.component.css'
})
export class AddRuleComponent {
  @Input() listOfRulesIncoming: RuleDto = {
    BuyRules:[],
    SellRules: []
  }
  @Input() listOfLinesIncoming: lineType[] = []
  readonly dialogRef = inject(MatDialogRef<AddRuleComponent>);

  availableLines: lineType[] = []
  selectedBuyLine: string = ''
  selectedSellLine: string = ''

  addBuyRule() {
    this.listOfRulesIncoming.BuyRules.push({
      id: this.listOfRulesIncoming.BuyRules.length,
      lineId: 0,
      primaryObject: '',
      desiredAction: '',
      referencedObject: ''
    })
  }
  addSellRule() {
    this.listOfRulesIncoming.SellRules.push({
      id: this.listOfRulesIncoming.SellRules.length,
      lineId: 0,
      primaryObject: '',
      desiredAction: '',
      referencedObject: ''
    })
  }
  removeBuyRule(id: number) {
    this.selectedBuyLine = ''
    this.listOfRulesIncoming.BuyRules = this.listOfRulesIncoming.BuyRules.filter(e => e.id != id)
  }
  removeSellRule(id: number) {
    this.selectedSellLine = ''
    this.listOfRulesIncoming.SellRules = this.listOfRulesIncoming.SellRules.filter(e => e.id != id)
  }

  onSelectedRuleTypeChange(event: any, id: number) {
    if (event.isUserInput == true) {
      this.availableLines = this.availableLines.filter(e => e.id != id)
      console.log(this.availableLines)
    }
  }

  onSubmit() {
    this.dialogRef.close(this.listOfRulesIncoming)
  }
  ngOnInit(){
    console.log('here in rule init')
    this.availableLines = structuredClone(this.listOfLinesIncoming)
  }


}
