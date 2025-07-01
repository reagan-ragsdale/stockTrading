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
    BuyRules: [],
    SellRules: [],
    NumberOfLossesInARowToStop: 0,
    TimeOutAfterStopLossSell: 0,
    StartDate: ''
  }
  @Input() listOfLinesIncoming: lineType[] = []
  readonly dialogRef = inject(MatDialogRef<AddRuleComponent>);

  availableLines: lineType[] = []
  selectedBuyLine: string = ''
  selectedSellLine: string = ''
  availableBuyActions: string[] = ['Crosses above:', 'Dips below:', 'Rises above:', 'Trend Crosses Above:', 'Crosses below:', 'Is greater than:', 'Is less than:']
  availableSellPriceActions: string[] = ['Take Profit', 'Stop Loss', 'Trailing Stop',]
  availableSellLineActions: string[] = ['Crosses below:', 'Dips below:', 'Rises above:', 'Trend Crosses Below:', 'Crosses above:', 'Is greater than:', 'Is less than:', 'Is Greater than previous buy']
  sellConditionTypes: string[] = ['Line Action', 'Price Action']
  buyConditionTypes: string[] = ['Line', 'Time']
  timeConditions: string[] = ['After']
  andOrList: string[] = ['And', 'Or']

  addBuyRule() {
    this.listOfRulesIncoming.BuyRules.push({
      id: this.listOfRulesIncoming.BuyRules.length,

      conditionType: '',
      buyTimeType: '',
      buyTime: 0,
      buyTimeChecked: false,
      buyTimeCheckToAmnt: 0,
      buyTimeCheckFromAmnt: 0,
      buyTimeCheckStepAmnt: 0,
      buyTimeUId: this.listOfRulesIncoming.BuyRules.length + 'A',
      primaryObject: {
        name: '',
        type: '',
        lineId: -1,
        length: 0,
        lengthLoopChecked: false,
        lengthLoopCheckToAmnt: 0,
        lengthLoopCheckFromAmnt: 0,
        lengthLoopCheckStepAmnt: 0,
        data: []
      },
      desiredAction: {
        amount: 0,
        amountLoopChecked: false,
        amountLoopCheckToAmnt: 0,
        amountLoopCheckFromAmnt: 0,
        amountLoopCheckStepAmnt: 0,
        amountLoopUId: this.listOfRulesIncoming.BuyRules.length + 'B',
        length: 0,
        lengthLoopChecked: false,
        lengthLoopCheckToAmnt: 0,
        lengthLoopCheckFromAmnt: 0,
        lengthLoopCheckStepAmnt: 0,
        lengthLoopUId: this.listOfRulesIncoming.BuyRules.length + 'C',
        type: ''
      },
      referencedObject: {
        name: '',
        type: '',
        lineId: -1,
        length: 0,
        lengthLoopChecked: false,
        lengthLoopCheckToAmnt: 0,
        lengthLoopCheckFromAmnt: 0,
        lengthLoopCheckStepAmnt: 0,
        data: []
      },
    })
  }
  addSellRule() {
    this.listOfRulesIncoming.SellRules.push({
      id: this.listOfRulesIncoming.SellRules.length,

      andOr: '',
      conditionType: '',
      primaryObject: {
        name: '',
        type: '',
        lineId: -1,
        length: 0,
        lengthLoopChecked: false,
        lengthLoopCheckToAmnt: 0,
        lengthLoopCheckFromAmnt: 0,
        lengthLoopCheckStepAmnt: 0,
        data: []
      },

      desiredAction: {
        amount: 0,
        amountLoopChecked: false,
        amountLoopCheckToAmnt: 0,
        amountLoopCheckFromAmnt: 0,
        amountLoopCheckStepAmnt: 0,
        amountLoopUId: this.listOfRulesIncoming.SellRules.length + 'A',
        type: '',
        length: 0,
        lengthLoopChecked: false,
        lengthLoopCheckToAmnt: 0,
        lengthLoopCheckFromAmnt: 0,
        lengthLoopCheckStepAmnt: 0,
        lengthLoopUId: this.listOfRulesIncoming.SellRules.length + 'B',
        current: 0

      },
      tradeHigh: 0,
      referencedObject: {
        name: '',
        type: '',
        lineId: -1,
        length: 0,
        lengthLoopChecked: false,
        lengthLoopCheckToAmnt: 0,
        lengthLoopCheckFromAmnt: 0,
        lengthLoopCheckStepAmnt: 0,
        data: []
      },
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
  onSelectedBuyConditionTypeChange(event: any, id: number, type: string) {
    if (event.isUserInput == true) {
      let selectedBuyRule = this.listOfRulesIncoming.BuyRules.filter(e => e.id == id)[0]
      selectedBuyRule.conditionType = type
    }
  }
  onSelectedBuyTimeTypeChange(event: any, id: number, time: string) {
    if (event.isUserInput == true) {
      let selectedBuyRule = this.listOfRulesIncoming.BuyRules.filter(e => e.id == id)[0]
      selectedBuyRule.desiredAction.type = time
    }
  }
  /*  onSelectedBuyTimeChange(event: any, id: number, time: number){
     if (event.isUserInput == true) {
       let selectedBuyRule = this.listOfRulesIncoming.BuyRules.filter(e => e.id == id)[0]
       selectedBuyRule.buyTime = time
     }
   } */

  onSelectedBuyRuleTypeChange(event: any, id: number, line: lineType) {
    if (event.isUserInput == true) {
      let selectedBuyRule = this.listOfRulesIncoming.BuyRules.filter(e => e.id == id)[0]
      selectedBuyRule.primaryObject.name = line.lineType + ' - ' + line.lineLength
      selectedBuyRule.primaryObject.type = line.lineType
      selectedBuyRule.primaryObject.length = line.lineLength
      selectedBuyRule.primaryObject.data = line.data
      selectedBuyRule.primaryObject.lineId = line.id
    }
  }
  onSelectedBuyActionTypeChange(event: any, id: number, action: string) {
    if (event.isUserInput == true) {
      let selectedBuyRule = this.listOfRulesIncoming.BuyRules.filter(e => e.id == id)[0]
      selectedBuyRule.desiredAction.type = action
    }
  }
  onSelectedBuyReferencedObjectTypeChange(event: any, id: number, line: lineType) {
    if (event.isUserInput == true) {
      let selectedBuyRule = this.listOfRulesIncoming.BuyRules.filter(e => e.id == id)[0]
      selectedBuyRule.referencedObject.name = line.lineType + ' - ' + line.lineLength
      selectedBuyRule.referencedObject.type = line.lineType
      selectedBuyRule.referencedObject.length = line.lineLength
      selectedBuyRule.referencedObject.data = line.data
      selectedBuyRule.referencedObject.lineId = line.id
    }
  }
  onSelectedSellRuleAndOrTypeChange(event: any, id: number, andOr: string) {
    if (event.isUserInput == true) {
      let selectedSellRule = this.listOfRulesIncoming.SellRules.filter(e => e.id == id)[0]
      selectedSellRule.andOr = andOr
    }
  }
  onSelectedSellRuleConditionTypeChange(event: any, id: number, type: string) {
    if (event.isUserInput == true) {
      let selectedSellRule = this.listOfRulesIncoming.SellRules.filter(e => e.id == id)[0]
      selectedSellRule.conditionType = type
    }
  }
  onSelectedSellRuleTypeChange(event: any, id: number, line: lineType) {
    if (event.isUserInput == true) {
      let selectedSellRule = this.listOfRulesIncoming.SellRules.filter(e => e.id == id)[0]
      selectedSellRule.primaryObject.name = line.lineType + ' - ' + line.lineLength
      selectedSellRule.primaryObject.type = line.lineType
      selectedSellRule.primaryObject.length = line.lineLength
      selectedSellRule.primaryObject.data = line.data
      selectedSellRule.primaryObject.lineId = line.id
    }
  }
  onSelectedSellActionTypeChange(event: any, id: number, action: string) {
    if (event.isUserInput == true) {
      let selectedSellRule = this.listOfRulesIncoming.SellRules.filter(e => e.id == id)[0]
      selectedSellRule.desiredAction.type = action
    }
  }
  onSelectedSellReferencedObjectTypeChange(event: any, id: number, line: lineType) {
    if (event.isUserInput == true) {
      let selectedSellRule = this.listOfRulesIncoming.SellRules.filter(e => e.id == id)[0]
      selectedSellRule.referencedObject.name = line.lineType + ' - ' + line.lineLength
      selectedSellRule.referencedObject.type = line.lineType
      selectedSellRule.referencedObject.length = line.lineLength
      selectedSellRule.referencedObject.data = line.data
      selectedSellRule.referencedObject.lineId = line.id
    }
  }

  isAllLine(lineType: string): boolean {
    if (lineType == 'Price' || lineType == 'Cumulative VWAP' || lineType == 'Cumulative SMA' || lineType == 'Cumulative EMA') {
      return true
    }
    return false
  }
  sellRulesContainsStopLoss(): boolean {
    for (let i = 0; i < this.listOfRulesIncoming.SellRules.length; i++) {
      if (this.listOfRulesIncoming.SellRules[i].desiredAction.type == 'Stop Loss') {
        return true
      }
    }
    return false
  }


  onSubmit() {
    this.dialogRef.close(this.listOfRulesIncoming)
  }
  ngOnInit() {
    this.availableLines = structuredClone(this.listOfLinesIncoming)
    this.availableLines = this.availableLines.filter(e => e.lineType != 'Bollinger Bands')
  }


}
