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
  availableBuyActions: string[] = ['Crosses above:', 'Dips below:']
  availableSellActions: string[] = ['Crosses below:', 'Rises above:']

  addBuyRule() {
    this.listOfRulesIncoming.BuyRules.push({
      id: this.listOfRulesIncoming.BuyRules.length,
      lineId: 0,
      primaryObject: '',
      primaryObjectType: '',
      primaryObjectLength: 0,
      primaryObjectData: [],
      desiredAction: '',
      desiredActionAmnt: 0,
      referencedObject: '',
      referencedObjectType: '',
      referencedObjectLength: 0,
      referencedObjectData: []
    })
  }
  addSellRule() {
    this.listOfRulesIncoming.SellRules.push({
      id: this.listOfRulesIncoming.SellRules.length,
      lineId: 0,
      primaryObject: '',
      primaryObjectType: '',
      primaryObjectLength: 0,
      primaryObjectData: [],
      desiredAction: '',
      desiredActionAmnt: 0,
      referencedObject: '',
      referencedObjectType: '',
      referencedObjectLength: 0,
      referencedObjectData: []
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

  onSelectedBuyRuleTypeChange(event: any, id: number, line: lineType) {
    if (event.isUserInput == true) {
      let selectedBuyRule = this.listOfRulesIncoming.BuyRules.filter(e => e.id == id)[0]
      selectedBuyRule.primaryObject = line.lineType + ' - ' + line.lineLength
      selectedBuyRule.primaryObjectType = line.lineType
      selectedBuyRule.primaryObjectLength = line.lineLength
      selectedBuyRule.primaryObjectData = line.data
    }
  }
  onSelectedBuyActionTypeChange(event: any, id: number, action: string) {
    if (event.isUserInput == true) {
      let selectedBuyRule = this.listOfRulesIncoming.BuyRules.filter(e => e.id == id)[0]
      selectedBuyRule.desiredAction = action
    }
  }
  onSelectedBuyReferencedObjectTypeChange(event: any, id: number, line: lineType) {
    if (event.isUserInput == true) {
      let selectedBuyRule = this.listOfRulesIncoming.BuyRules.filter(e => e.id == id)[0]
      selectedBuyRule.referencedObject = line.lineType + ' - ' + line.lineLength
      selectedBuyRule.referencedObjectType = line.lineType
      selectedBuyRule.referencedObjectLength = line.lineLength
      selectedBuyRule.referencedObjectData = line.data
    }
  }
  onSelectedSellRuleTypeChange(event: any, id: number, line: lineType) {
    if (event.isUserInput == true) {
      let selectedSellRule = this.listOfRulesIncoming.SellRules.filter(e => e.id == id)[0]
      selectedSellRule.primaryObject = line.lineType + ' - ' + line.lineLength
      selectedSellRule.primaryObjectType = line.lineType
      selectedSellRule.primaryObjectLength = line.lineLength
      selectedSellRule.primaryObjectData = line.data
    }
  }
  onSelectedSellActionTypeChange(event: any, id: number, action: string) {
    if (event.isUserInput == true) {
      let selectedSellRule = this.listOfRulesIncoming.SellRules.filter(e => e.id == id)[0]
      selectedSellRule.desiredAction = action
    }
  }
  onSelectedSellReferencedObjectTypeChange(event: any, id: number, line: lineType) {
    if (event.isUserInput == true) {
      let selectedSellRule = this.listOfRulesIncoming.SellRules.filter(e => e.id == id)[0]
      selectedSellRule.referencedObject = line.lineType + ' - ' + line.lineLength
      selectedSellRule.referencedObjectType = line.lineType
      selectedSellRule.referencedObjectLength = line.lineLength
      selectedSellRule.referencedObjectData = line.data
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
